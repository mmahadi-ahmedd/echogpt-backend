import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AIProviderAdapter, ChatMessage, AIResponse, HealthStatus } from './ai-provider.interface';

@Injectable()
export class ClaudeAdapter implements AIProviderAdapter {
  async sendMessage(messages: ChatMessage[], apiKey: string, model: string): Promise<AIResponse> {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');

    return {
      content: textBlock && 'text' in textBlock ? textBlock.text : '',
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
    };
  }

  async healthCheck(apiKey: string, model: string): Promise<HealthStatus> {
    try {
      const client = new Anthropic({ apiKey });
      await client.messages.create({
        model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return { healthy: true, message: 'Claude provider is reachable' };
    } catch (err: any) {
      return { healthy: false, message: err.message ?? 'Health check failed' };
    }
  }
}