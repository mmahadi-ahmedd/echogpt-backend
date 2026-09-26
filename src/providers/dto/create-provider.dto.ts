import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ example: 'openai' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'gpt-4o' })
  @IsString()
  model: string;

  @ApiProperty({ example: 'sk-abc123...' })
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}