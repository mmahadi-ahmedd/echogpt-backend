import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AIProviderAdapter, ChatMessage, AIResponse, HealthStatus } from './ai-provider.interface';

@Injectable()
export class OpenAIAdapter implements AIProviderAdapter {
  async sendMessage(messages: ChatMessage[], apiKey: string, model: string): Promise<AIResponse> {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    return {
      content: response.choices[0]?.message?.content ?? '',
      tokensUsed: response.usage?.total_tokens,
    };
  }

  async healthCheck(apiKey: string, model: string): Promise<HealthStatus> {
    try {
      const client = new OpenAI({ apiKey });
      await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      });
      return { healthy: true, message: 'OpenAI provider is reachable' };
    } catch (err: any) {
      return { healthy: false, message: err.message ?? 'Health check failed' };
    }
  }
}