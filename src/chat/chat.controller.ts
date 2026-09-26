import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a prompt and receive an AI response' })
  sendMessage(@CurrentUser() user: { id: string }, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(user.id, dto.prompt, dto.providerName, dto.conversationId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversation history' })
  getConversations(@CurrentUser() user: { id: string }, @Query() query: ConversationQueryDto) {
    return this.chatService.getConversations(user.id, query.page, query.limit);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get one conversation with all its messages' })
  getConversation(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.chatService.getConversation(user.id, id);
  }
}