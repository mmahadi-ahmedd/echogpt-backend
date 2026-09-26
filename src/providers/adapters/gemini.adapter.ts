import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProviderAdapter, ChatMessage, AIResponse, HealthStatus } from './ai-provider.interface';

@Injectable()
export class GeminiAdapter implements AIProviderAdapter {
  async sendMessage(messages: ChatMessage[], apiKey: string, model: string): Promise<AIResponse> {
    const client = new GoogleGenerativeAI(apiKey);
    const genModel = client.getGenerativeModel({ model });

    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const result = await genModel.generateContent(prompt);

    return {
      content: result.response.text(),
      tokensUsed: result.response.usageMetadata?.totalTokenCount,
    };
  }

  async healthCheck(apiKey: string, model: string): Promise<HealthStatus> {
    try {
      const client = new GoogleGenerativeAI(apiKey);
      const genModel = client.getGenerativeModel({ model });
      await genModel.generateContent('ping');
      return { healthy: true, message: 'Gemini provider is reachable' };
    } catch (err: any) {
      return { healthy: false, message: err.message ?? 'Health check failed' };
    }
  }
}