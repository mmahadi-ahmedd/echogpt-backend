import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { SearchCacheService } from './search-cache.service';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  controllers: [SearchController],
  providers: [SearchService, SearchCacheService],
})
export class SearchModule {}