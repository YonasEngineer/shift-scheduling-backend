import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Skill } from '../../generated/prisma/client.js';

@Injectable()
export class SkillService {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string): Promise<Skill> {
    return this.prisma.skill.create({
      data: { name },
    });
  }

  async findAll(): Promise<Skill[]> {
    return this.prisma.skill.findMany();
  }

  async findOne(id: string): Promise<Skill> {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) throw new NotFoundException(`Skill with ID ${id} not found`);
    return skill;
  }

  async update(
    id: string,
    data: { name?: string; description?: string },
  ): Promise<Skill> {
    await this.findOne(id); // check if exists
    return this.prisma.skill.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Skill> {
    await this.findOne(id); // check if exists
    return this.prisma.skill.delete({ where: { id } });
  }
}
