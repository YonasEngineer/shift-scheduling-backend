import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ShiftService {
  constructor(private prisma: PrismaService) {}

  //  Create shift
  async create(data: {
    locationId: string;
    scheduleId: string;
    startTime: Date;
    endTime: Date;
    requiredSkillId: string;
    requiredHeadcount: number;
    createdBy: string;
    assignedUserIds: string[];
  }) {
    const { assignedUserIds, ...shiftData } = data;
    console.log('see the assignedUserIds', assignedUserIds);
    console.log('see the shiftData', shiftData);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create shift
      const shift = await tx.shifts.create({
        data: shiftData,
      });

      // 2. Create assignments (if any)
      if (assignedUserIds?.length) {
        await tx.shiftAssignments.createMany({
          data: assignedUserIds.map((userId) => ({
            shiftId: shift.id,
            userId,
            status: 'ASSIGNED',
          })),
        });
      }

      return shift;
    });
  }

  // Get shifts by schedule
  async getBySchedule(scheduleId: string) {
    return this.prisma.shifts.findMany({
      where: { scheduleId },
      include: {
        requiredSkill: true,
        shiftAssignments: {
          include: { user: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getStaffAssignments(userId: string) {
    return this.prisma.shiftAssignments.findMany({
      where: {
        userId,
      },
      include: {
        shift: {
          include: {
            location: true,
            requiredSkill: true,

            swapRequests: {
              where: {
                OR: [
                  // DROP → visible to everyone
                  {
                    type: 'DROP',
                    status: 'PENDING',
                  },

                  // SWAP → only if current user is target
                  {
                    type: 'SWAP',
                    status: 'PENDING',
                    targetUserId: userId,
                  },
                ],
              },
              include: {
                requester: true,
                targetUser: true,
              },
            },
          },
        },
      },
    });
  }

  //  Assign user to shift
  async assignUser(shiftId: string, userId: string) {
    return this.prisma.shiftAssignments.create({
      data: {
        shiftId,
        userId,
      },
    });
  }

  //  Remove user from shift
  async removeUser(shiftId: string, userId: string) {
    return this.prisma.shiftAssignments.delete({
      where: {
        shiftId_userId: {
          shiftId,
          userId,
        },
      },
    });
  }

  //  Delete shift
  async delete(shiftId: string) {
    return this.prisma.shifts.delete({
      where: { id: shiftId },
    });
  }
}
