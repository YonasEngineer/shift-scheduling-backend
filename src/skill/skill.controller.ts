import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { SkillService } from './skill.service.js';
import { Skill } from '../../generated/prisma/client.js';

@Controller('skill')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Post()
  async create(
    @Body() body: { name: string; description?: string },
  ): Promise<Skill> {
    return this.skillService.create(body.name);
  }

  @Get()
  async findAll(): Promise<Skill[]> {
    return this.skillService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Skill> {
    return this.skillService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
  ): Promise<Skill> {
    return this.skillService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Skill> {
    return this.skillService.remove(id);
  }
}
