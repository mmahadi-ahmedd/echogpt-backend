import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Explain JWT in simple terms' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ example: 'gemini', description: 'Provider name — omit to use the default' })
  @IsOptional()
  @IsString()
  providerName?: string;

  @ApiPropertyOptional({ description: 'Existing conversation ID — omit to start a new conversation' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}