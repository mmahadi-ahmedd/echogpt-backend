import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { EncryptionService } from './encryption.service';
import { ProviderRegistryService } from './provider-registry.service';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { ClaudeAdapter } from './adapters/claude.adapter';
import { GeminiAdapter } from './adapters/gemini.adapter';

@Module({
  controllers: [ProvidersController],
  providers: [
    ProvidersService,
    EncryptionService,
    ProviderRegistryService,
    OpenAIAdapter,
    ClaudeAdapter,
    GeminiAdapter,
  ],
  exports: [ProvidersService, ProviderRegistryService],
})
export class ProvidersModule {}