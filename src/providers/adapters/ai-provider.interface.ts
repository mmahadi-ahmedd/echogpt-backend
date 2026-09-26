export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  tokensUsed?: number;
}

export interface HealthStatus {
  healthy: boolean;
  message: string;
}

export interface AIProviderAdapter {
  sendMessage(messages: ChatMessage[], apiKey: string, model: string): Promise<AIResponse>;
  healthCheck(apiKey: string, model: string): Promise<HealthStatus>;
  streamMessage?(messages: ChatMessage[], apiKey: string, model: string): AsyncGenerator<string>;
}