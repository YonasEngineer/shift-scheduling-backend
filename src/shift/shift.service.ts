import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StaffGateway } from '../socket/staff.getway.js';

@Injectable()
export class ShiftService {
  constructor(
    private prisma: PrismaService,

    private staffGateway: StaffGateway,
  ) {}

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

    const createdShift = await this.prisma.$transaction(
      async (tx) => {
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
      },
      { timeout: 50000 }, // 50s
    );

    const assignments = await this.prisma.shiftAssignments.findMany({
      where: {
        shiftId: createdShift.id,
        userId: { in: assignedUserIds },
      },
      include: {
        shift: {
          include: {
            location: true,
            requiredSkill: true,
            swapRequests: {
              include: {
                requester: true,
                targetUser: true,
              },
            },
          },
        },
      },
    });

    for (const assignment of assignments) {
      this.staffGateway.sendToStaff(
        assignment.userId,
        'shift-created',
        assignment,
      );
    }
    return createdShift;
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
    return await this.prisma.shiftAssignments.findMany({
      where: {
        userId,
        status: {
          in: ['ASSIGNED', 'PENDING_SWAP'],
        },

        // 'ASSIGNED',
      },
      include: {
        shift: {
          include: {
            location: true,
            requiredSkill: true,

            swapRequests: {
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
