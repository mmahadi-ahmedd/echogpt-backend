import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { ProviderRegistryService } from '../providers/provider-registry.service';
import { SearchCacheService } from './search-cache.service';

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private registry: ProviderRegistryService,
    private cache: SearchCacheService,
  ) {}

  async search(userId: string, query: string) {
    const cacheKey = query.trim().toLowerCase();
    let resultSummary = this.cache.get(cacheKey);
    let fromCache = true;

    if (!resultSummary) {
      fromCache = false;
      const providerRecord = await this.providersService.getDecryptedDefaultOrNamed();
      const adapter = this.registry.resolve(providerRecord.name);

      const result = await adapter.sendMessage(
        [{ role: 'user', content: `Provide a concise, factual answer to this search query: ${query}` }],
        providerRecord.apiKey,
        providerRecord.model,
      );
      resultSummary = result.content;
      this.cache.set(cacheKey, resultSummary);
    }

    await this.prisma.webSearch.create({
      data: { userId, query, resultSummary },
    });

    return { query, resultSummary, fromCache };
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.webSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.webSearch.count({ where: { userId } }),
    ]);
    return { data, total, page, limit };
  }

  async getRecent(userId: string) {
    return this.prisma.webSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  async getSuggestions(userId: string, partial: string) {
    if (!partial || partial.length < 2) return [];

    const matches = await this.prisma.webSearch.findMany({
      where: { userId, query: { contains: partial, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { query: true },
      distinct: ['query'],
    });

    return matches.map((m) => m.query);
  }
}