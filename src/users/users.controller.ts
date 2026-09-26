import { Body, Controller, Delete, Get, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the logged-in user\'s profile' })
  getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the logged-in user\'s profile' })
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto.email);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change the logged-in user\'s password' })
  changePassword(@CurrentUser() user: { id: string }, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete the logged-in user\'s account' })
  deleteAccount(@CurrentUser() user: { id: string }) {
    return this.usersService.deleteAccount(user.id);
  }

  @Get()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: '[Admin] List all users' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  listAllUsers() {
    return this.usersService.listAllUsers();
  }
}