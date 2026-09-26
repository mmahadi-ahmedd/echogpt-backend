import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@ApiTags('AI Providers')
@ApiBearerAuth()
@Roles(RoleName.ADMIN)
@Controller('providers')
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Post()
  @ApiOperation({ summary: '[Admin] Add a new AI provider' })
  create(@Body() dto: CreateProviderDto) {
    return this.providersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '[Admin] List all AI providers' })
  findAll() {
    return this.providersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get one AI provider' })
  findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '[Admin] Edit an AI provider' })
  update(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.providersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Delete an AI provider' })
  remove(@Param('id') id: string) {
    return this.providersService.remove(id);
  }

  @Get(':id/health')
  @ApiOperation({ summary: '[Admin] Health-check an AI provider' })
  healthCheck(@Param('id') id: string) {
    return this.providersService.healthCheck(id);
  }
}