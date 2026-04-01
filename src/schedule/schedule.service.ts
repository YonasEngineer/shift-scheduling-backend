import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  //  Create schedule
  async create(data: {
    locationId: string;
    weekStart: Date;
    createdBy: string;
  }) {
    const result = await this.prisma.schedule.create({
      data,
    });
    return result;
  }

  //  Get schedules for manager
  async getManagerSchedules(managerId: string) {
    return this.prisma.schedule.findMany({
      where: {
        createdBy: managerId,
      },
      include: {
        location: true,
        shifts: {
          include: {
            requiredSkill: true,
            shiftAssignments: {
              include: { user: true },
            },
          },
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: {
        weekStart: 'desc',
      },
    });
  }

  //  Get single schedule
  async getById(id: string) {
    return this.prisma.schedule.findUnique({
      where: { id },
      include: {
        location: true,
        shifts: {
          include: {
            requiredSkill: true,
            shiftAssignments: {
              include: { user: true },
            },
          },
        },
      },
    });
  }

  // Publish schedule
  async publish(id: string) {
    return this.prisma.schedule.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
      },
    });
  }

  //  Delete schedule
  async delete(id: string) {
    return this.prisma.schedule.delete({
      where: { id },
    });
  }
}
