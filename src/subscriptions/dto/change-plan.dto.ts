import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PlanType } from '@prisma/client';

export class ChangePlanDto {
  @ApiProperty({ enum: PlanType, example: PlanType.PREMIUM })
  @IsEnum(PlanType)
  plan: PlanType;
}