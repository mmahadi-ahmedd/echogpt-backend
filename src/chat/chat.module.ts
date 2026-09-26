import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ProvidersModule } from '../providers/providers.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [ProvidersModule, SubscriptionsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}