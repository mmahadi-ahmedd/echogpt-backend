import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({ example: 'latest NestJS features' })
  @IsString()
  query: string;
}