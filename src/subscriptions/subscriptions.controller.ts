import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { ChangePlanDto } from './dto/change-plan.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscription')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current subscription status' })
  getSubscription(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getSubscription(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Upgrade or downgrade subscription plan' })
  changePlan(@CurrentUser() user: { id: string }, @Body() dto: ChangePlanDto) {
    return this.subscriptionsService.changePlan(user.id, dto.plan);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get remaining requests for today' })
  getUsage(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getUsage(user.id);
  }
}