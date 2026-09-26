import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanType } from '@prisma/client';
import { PLAN_LIMITS } from './plan-limits';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }

  async changePlan(userId: string, plan: PlanType) {
    const dailyLimit = PLAN_LIMITS[plan];

    const subscription = await this.prisma.subscription.update({
      where: { userId },
      data: { plan, dailyLimit, renewsAt: this.nextMidnight() },
    });

    return subscription;
  }

  async getUsage(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const usedToday = await this.prisma.apiUsageLog.count({
      where: { userId, createdAt: { gte: startOfDay } },
    });

    const remaining = Math.max(subscription.dailyLimit - usedToday, 0);

    return {
      plan: subscription.plan,
      dailyLimit: subscription.dailyLimit,
      usedToday,
      remaining,
    };
  }

  private nextMidnight(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}