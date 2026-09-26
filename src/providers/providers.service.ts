import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { ProviderRegistryService } from './provider-registry.service';

@Injectable()
export class ProvidersService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private registry: ProviderRegistryService,
  ) {}

  private toSafeDto(provider: any) {
    const { encryptedApiKey, ...rest } = provider;
    return { ...rest, apiKeyPreview: this.encryption.mask(encryptedApiKey) };
  }

  async create(dto: { name: string; model: string; apiKey: string; isEnabled?: boolean; isDefault?: boolean }) {
    const encryptedApiKey = this.encryption.encrypt(dto.apiKey);

    if (dto.isDefault) {
      await this.prisma.aiProvider.updateMany({ data: { isDefault: false } });
    }

    const provider = await this.prisma.aiProvider.create({
      data: {
        name: dto.name,
        model: dto.model,
        encryptedApiKey,
        isEnabled: dto.isEnabled ?? true,
        isDefault: dto.isDefault ?? false,
      },
    });

    return this.toSafeDto(provider);
  }

  async findAll() {
    const providers = await this.prisma.aiProvider.findMany();
    return providers.map((p) => this.toSafeDto(p));
  }

  async findOne(id: string) {
    const provider = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('Provider not found');
    return this.toSafeDto(provider);
  }

  async update(id: string, dto: { model?: string; apiKey?: string; isEnabled?: boolean; isDefault?: boolean }) {
    const existing = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Provider not found');

    if (dto.isDefault) {
      await this.prisma.aiProvider.updateMany({ data: { isDefault: false } });
    }

    const provider = await this.prisma.aiProvider.update({
      where: { id },
      data: {
        ...(dto.model && { model: dto.model }),
        ...(dto.apiKey && { encryptedApiKey: this.encryption.encrypt(dto.apiKey) }),
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });

    return this.toSafeDto(provider);
  }

  async remove(id: string) {
    const existing = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Provider not found');

    await this.prisma.aiProvider.delete({ where: { id } });
    return { message: 'Provider deleted successfully' };
  }

  async healthCheck(id: string) {
    const provider = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('Provider not found');

    const apiKey = this.encryption.decrypt(provider.encryptedApiKey);
    const adapter = this.registry.resolve(provider.name);

    return adapter.healthCheck(apiKey, provider.model);
  }

  /** Used internally by ChatModule — never exposed via a controller response */
  async getDecryptedDefaultOrNamed(providerName?: string) {
    const provider = providerName
      ? await this.prisma.aiProvider.findFirst({ where: { name: providerName, isEnabled: true } })
      : await this.prisma.aiProvider.findFirst({ where: { isDefault: true, isEnabled: true } });

    if (!provider) throw new NotFoundException('No enabled provider found');

    return {
      id: provider.id,
      name: provider.name,
      model: provider.model,
      apiKey: this.encryption.decrypt(provider.encryptedApiKey),
    };
  }
}