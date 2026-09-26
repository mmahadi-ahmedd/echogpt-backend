import { Injectable } from '@nestjs/common';

interface CacheEntry {
  value: any;
  expiresAt: number;
}

@Injectable()
export class SearchCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly ttlMs = 10 * 60 * 1000; // 10 minutes

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: any): void {
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}