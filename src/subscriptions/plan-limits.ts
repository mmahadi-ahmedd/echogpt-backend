import { PlanType } from '@prisma/client';

export const PLAN_LIMITS: Record<PlanType, number> = {
  [PlanType.FREE]: 20,
  [PlanType.PREMIUM]: 500,
};