import { Injectable, BadRequestException } from '@nestjs/common';
import { AIProviderAdapter } from './adapters/ai-provider.interface';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { ClaudeAdapter } from './adapters/claude.adapter';
import { GeminiAdapter } from './adapters/gemini.adapter';

@Injectable()
export class ProviderRegistryService {
  private readonly adapters: Record<string, AIProviderAdapter>;

  constructor(
    private openai: OpenAIAdapter,
    private claude: ClaudeAdapter,
    private gemini: GeminiAdapter,
  ) {
    this.adapters = {
      openai: this.openai,
      claude: this.claude,
      gemini: this.gemini,
    };
  }

  resolve(providerName: string): AIProviderAdapter {
    const adapter = this.adapters[providerName.toLowerCase()];
    if (!adapter) {
      throw new BadRequestException(`No adapter available for provider "${providerName}"`);
    }
    return adapter;
  }
}