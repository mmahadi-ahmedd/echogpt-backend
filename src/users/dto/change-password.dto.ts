import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldP@ss123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewP@ss456' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}