import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Post()
  @ApiOperation({ summary: 'Run an AI-assisted web search query' })
  search(@CurrentUser() user: { id: string }, @Body() dto: SearchQueryDto) {
    return this.searchService.search(user.id, dto.query);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get search history' })
  getHistory(@CurrentUser() user: { id: string }, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.searchService.getHistory(user.id, Number(page) || 1, Number(limit) || 20);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get the 5 most recent searches' })
  getRecent(@CurrentUser() user: { id: string }) {
    return this.searchService.getRecent(user.id);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions based on past queries' })
  getSuggestions(@CurrentUser() user: { id: string }, @Query('q') q: string) {
    return this.searchService.getSuggestions(user.id, q);
  }
}