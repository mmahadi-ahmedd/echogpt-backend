import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, subscription: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
      isActive: user.isActive,
      plan: user.subscription?.plan,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, email?: string) {
    if (email) {
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { ...(email && { email }) },
      include: { role: true },
    });

    return { id: user.id, email: user.email, role: user.role.name };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all existing sessions so old refresh tokens stop working
    await this.prisma.session.deleteMany({ where: { userId } });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id: userId } });
    // Cascades delete sessions, subscription, conversations, etc. via schema onDelete: Cascade

    return { message: 'Account deleted successfully' };
  }

  // Admin-only
  async listAllUsers() {
    const users = await this.prisma.user.findMany({
      include: { role: true, subscription: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role.name,
      isActive: u.isActive,
      plan: u.subscription?.plan,
      createdAt: u.createdAt,
    }));
  }
}