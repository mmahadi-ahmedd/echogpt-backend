import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { ProviderRegistryService } from '../providers/provider-registry.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MessageRole } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private registry: ProviderRegistryService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async sendMessage(userId: string, prompt: string, providerName?: string, conversationId?: string) {
    // 1. Enforce usage limit
    const usage = await this.subscriptionsService.getUsage(userId);
    if (usage.remaining <= 0) {
      throw new ForbiddenException('Daily request limit reached. Upgrade your plan or try again tomorrow.');
    }

    // 2. Resolve conversation (existing or new)
    let conversation;
    if (conversationId) {
      conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (!conversation) throw new NotFoundException('Conversation not found');
    } else {
      conversation = await this.prisma.conversation.create({
        data: { userId, title: prompt.slice(0, 50) },
      });
    }

    // 3. Save the user's message
    await this.prisma.message.create({
      data: { conversationId: conversation.id, role: MessageRole.USER, content: prompt },
    });

    // 4. Resolve provider + adapter, call the AI
    let statusCode = 200;
    let aiContent = '';
    let tokensUsed: number | undefined;
    let resolvedProviderId: string | undefined;

    try {
      const providerRecord = await this.providersService.getDecryptedDefaultOrNamed(providerName);
      resolvedProviderId = providerRecord.id;
      const adapter = this.registry.resolve(providerRecord.name);

      const history = await this.prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' },
        take: 20, // cap context sent to the provider
      });

      const result = await adapter.sendMessage(
        history.map((m) => ({
          role: m.role === MessageRole.USER ? 'user' : 'assistant',
          content: m.content,
        })),
        providerRecord.apiKey,
        providerRecord.model,
      );

      aiContent = result.content;
      tokensUsed = result.tokensUsed;
    } catch (err: any) {
      statusCode = 502; // upstream provider failure
      aiContent = 'Sorry, the AI provider failed to respond. Please try again.';
    }

    // 5. Save the assistant's reply
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        providerId: resolvedProviderId,
        role: MessageRole.ASSISTANT,
        content: aiContent,
        tokensUsed,
      },
    });

    // 6. Log usage (this is what powers both rate-limiting and admin analytics)
    await this.prisma.apiUsageLog.create({
      data: {
        userId,
        providerId: resolvedProviderId,
        endpoint: '/chat',
        tokensUsed,
        statusCode,
      },
    });

    return {
      conversationId: conversation.id,
      message: assistantMessage,
    };
  }

  async getConversations(userId: string, page = 1, limit = 20) {
    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where: { userId } }),
    ]);

    return { data: conversations, total, page, limit };
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }
}