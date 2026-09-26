import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanType, RoleName } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalAdmins,
      freeUsers,
      premiumUsers,
      totalConversations,
      totalMessages,
      totalSearches,
      requestsToday,
      totalProviders,
      enabledProviders,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: { name: RoleName.ADMIN } } }),
      this.prisma.subscription.count({ where: { plan: PlanType.FREE } }),
      this.prisma.subscription.count({ where: { plan: PlanType.PREMIUM } }),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
      this.prisma.webSearch.count(),
      this.prisma.apiUsageLog.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.aiProvider.count(),
      this.prisma.aiProvider.count({ where: { isEnabled: true } }),
    ]);

    return {
      users: { total: totalUsers, admins: totalAdmins, free: freeUsers, premium: premiumUsers },
      usage: { totalConversations, totalMessages, totalSearches, requestsToday },
      providers: { total: totalProviders, enabled: enabledProviders },
    };
  }

  async listUsers(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        include: { role: true, subscription: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: data.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role.name,
        isActive: u.isActive,
        plan: u.subscription?.plan,
        createdAt: u.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async setUserActive(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    // Force logout everywhere if suspending
    if (!isActive) {
      await this.prisma.session.deleteMany({ where: { userId } });
    }

    return { id: updated.id, email: updated.email, isActive: updated.isActive };
  }

  async listSubscriptions(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.subscription.count(),
    ]);
    return { data, total, page, limit };
  }

  async setUserPlan(userId: string, plan: PlanType) {
    const dailyLimit = plan === PlanType.PREMIUM ? 500 : 20;

    const subscription = await this.prisma.subscription.update({
      where: { userId },
      data: { plan, dailyLimit },
    });

    return subscription;
  }

  async getUsageAnalytics(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await this.prisma.apiUsageLog.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, statusCode: true, providerId: true, endpoint: true },
    });

    const byDay: Record<string, number> = {};
    const byEndpoint: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const log of logs) {
      const day = log.createdAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
      byEndpoint[log.endpoint] = (byEndpoint[log.endpoint] || 0) + 1;
      const statusGroup = `${Math.floor(log.statusCode / 100)}xx`;
      byStatus[statusGroup] = (byStatus[statusGroup] || 0) + 1;
    }

    return { totalRequests: logs.length, byDay, byEndpoint, byStatus };
  }

  async getRequestLogs(page = 1, limit = 50) {
    const [data, total] = await Promise.all([
      this.prisma.apiUsageLog.findMany({
        include: { user: { select: { email: true } }, provider: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.apiUsageLog.count(),
    ]);
    return { data, total, page, limit };
  }

  async getSystemHealth() {
    let dbHealthy = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbHealthy = false;
    }

    const enabledProviders = await this.prisma.aiProvider.count({ where: { isEnabled: true } });

    return {
      status: dbHealthy ? 'healthy' : 'degraded',
      database: dbHealthy ? 'connected' : 'unreachable',
      enabledProviders,
      timestamp: new Date().toISOString(),
    };
  }
}