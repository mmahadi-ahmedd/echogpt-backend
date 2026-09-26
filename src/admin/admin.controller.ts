import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { SetActiveDto } from './dto/set-active.dto';
import { SetPlanDto } from './dto/set-plan.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(RoleName.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '[Admin] Dashboard statistics' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: '[Admin] List all users' })
  listUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.listUsers(Number(page) || 1, Number(limit) || 20);
  }

  @Patch('users/:id/active')
  @ApiOperation({ summary: '[Admin] Activate or suspend a user' })
  setUserActive(@Param('id') id: string, @Body() dto: SetActiveDto) {
    return this.adminService.setUserActive(id, dto.isActive);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: '[Admin] List all subscriptions' })
  listSubscriptions(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.listSubscriptions(Number(page) || 1, Number(limit) || 20);
  }

  @Patch('subscriptions/:userId')
  @ApiOperation({ summary: "[Admin] Change a user's subscription plan" })
  setUserPlan(@Param('userId') userId: string, @Body() dto: SetPlanDto) {
    return this.adminService.setUserPlan(userId, dto.plan);
  }

  @Get('analytics')
  @ApiOperation({ summary: '[Admin] API usage analytics' })
  getAnalytics(@Query('days') days?: number) {
    return this.adminService.getUsageAnalytics(Number(days) || 7);
  }

  @Get('logs')
  @ApiOperation({ summary: '[Admin] Request logs' })
  getLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getRequestLogs(Number(page) || 1, Number(limit) || 50);
  }

  @Get('health')
  @ApiOperation({ summary: '[Admin] System health check' })
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}