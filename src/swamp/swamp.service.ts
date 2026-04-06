// swap.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSwapDto } from './swamp.dto.js';
// import { SwapRequestType } from 'generated/prisma/enums.js';

@Injectable()
export class SwampService {
  constructor(private prisma: PrismaService) {}

  // CREATE SWAP
  async createSwap(userId: string, dto: CreateSwapDto) {
    console.log('see the swamp dto', dto);
    const { shiftId, type, targetUserId } = dto;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const shift = await this.prisma.shifts.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new BadRequestException('Shift not found');
    }

    const assignment = await this.prisma.shiftAssignments.findUnique({
      where: {
        shiftId_userId: { shiftId, userId },
      },
    });
    console.log('see the assignment', assignment);
    if (!assignment) {
      throw new BadRequestException('You are not assigned to this shift');
    }

    if (assignment.status !== 'ASSIGNED') {
      throw new BadRequestException('Shift is already in transition');
    }

    if (type === 'SWAP' && !targetUserId) {
      throw new BadRequestException('Target user required for swap');
    }

    // Prevent duplicate pending swap
    const existing = await this.prisma.swapRequests.findFirst({
      where: {
        shiftId,
        requesterId: userId,
        status: 'PENDING',
      },
    });

    if (existing) {
      throw new BadRequestException('Swap already pending');
    }

    //  Update assignment
    const assignement = await this.prisma.shiftAssignments.update({
      where: {
        shiftId_userId: { shiftId, userId },
      },
      data: {
        status: 'PENDING_SWAP',
      },
    });
    console.log('see the  assignement', assignement);
    //  Create swap
    const result = this.prisma.swapRequests.create({
      data: {
        shiftId,
        requesterId: userId,
        targetUserId: targetUserId || null,
        type,
        expiresAt: type === 'DROP' ? expiresAt : null,
      },
    });
    console.log('see the result', result);
    return result;
  }

  // GET ALL SWAPS (for user)
  async getMySwaps(userId: string) {
    return this.prisma.swapRequests.findMany({
      where: {
        targetUserId: userId,
        // status: {
        //   in: ['ACCEPTED', 'REJECTED', 'PENDING'],
        // },
        // managerStatus: {
        //   notIn: ['APPROVED', 'REJECTED'],
        // },
      },
      include: {
        shift: true,
        requester: true,
        targetUser: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async swampNeedingApproval(locationId: string) {
    const swapRequest = await this.prisma.swapRequests.findMany({
      where: {
        status: 'ACCEPTED',
        processedAt: null,
        shift: {
          locationId: locationId,
        },
      },
      include: {
        shift: true,
        requester: true,
        targetUser: true,
      },
    });
    console.log('see the swapRequest ', swapRequest);
    return swapRequest;
  }

  //  GET SINGLE SWAP
  async getSwapById(id: string) {
    return this.prisma.swapRequests.findUnique({
      where: { id },
      include: {
        shift: true,
        requester: true,
        targetUser: true,
      },
    });
  }

  async managerRejectSwap(swapId: string, managerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const swap = await tx.swapRequests.findUnique({
        where: { id: swapId },
      });

      if (!swap) throw new NotFoundException();

      // revert assignment back
      await tx.shiftAssignments.update({
        where: {
          shiftId_userId: {
            shiftId: swap.shiftId,
            userId: swap.requesterId,
          },
        },
        data: {
          status: 'ASSIGNED',
        },
      });

      const result = await tx.swapRequests.update({
        where: { id: swapId },
        data: {
          processedById: managerId,
          processedAt: new Date(),
          managerStatus: 'REJECTED',
        },
      });
      console.log('see the updated  swapRequests', result);
    });
  }

  async managerApproveSwap(swapId: string, managerId: string) {
    // 1. Fetch the swap request with its details
    return this.prisma.$transaction(async (tx) => {
      const swap = await tx.swapRequests.findUnique({
        where: { id: swapId },
      });

      if (!swap || !swap.targetUserId) {
        throw new NotFoundException();
      }

      // 1. Update old assignment
      await tx.shiftAssignments.update({
        where: {
          shiftId_userId: {
            shiftId: swap.shiftId,
            userId: swap.requesterId,
          },
        },
        data: {
          status: 'COMPLETED_SWAP',
        },
      });

      // 2. Create new assignment
      await tx.shiftAssignments.create({
        data: {
          shiftId: swap.shiftId,
          userId: swap.targetUserId,
          status: 'ASSIGNED',
        },
      });

      // 3. Approve swap
      return tx.swapRequests.update({
        where: { id: swapId },
        data: {
          processedAt: new Date(),
          processedById: managerId,
          managerStatus: 'APPROVED',
        },
      });
    });
    // console.log('see the  shiftAssignment', shiftAssignment);
    // console.log('see the updateSwapRequest', updateSwapRequest);
  }

  async staffAcceptSwap(swapId: string, targetUserId: string) {
    // 1. Fetch the swap request with its details
    const swap = await this.prisma.swapRequests.findUnique({
      where: { id: swapId },
      include: { shift: true },
    });
    console.log('see the swamp', swap);
    if (!swap) throw new NotFoundException('Swap request not found');
    if (swap.status !== 'PENDING')
      throw new BadRequestException('Swap is no longer pending');

    // Ensure the user accepting it is the intended target (if a target was specified)
    if (swap.targetUserId && swap.targetUserId !== targetUserId) {
      throw new BadRequestException(
        'You are not the designated target for this swap',
      );
    }

    // 2. Execute the swap in a Transaction
    return this.prisma.$transaction(async (tx) => {
      // A. Update the Swap Request status
      const updatedSwap = await tx.swapRequests.update({
        where: { id: swapId },
        data: {
          status: 'ACCEPTED',
          // processedAt: new Date(),
        },
      });
      console.log('see the   updatedSwap', updatedSwap);
      // C. Create the new assignment for the target user

      // // console.log('see the updated  shiftAssignment', shiftAssignment);
      // // (Optional) Invalidate other pending swaps for this specific shift assignment
      // // This prevents the same shift from being swapped multiple times simultaneously
      // await tx.swapRequests.updateMany({
      //   where: {
      //     shiftId: swap.shiftId,
      //     requesterId: swap.requesterId,
      //     status: 'PENDING',
      //     id: { not: swapId },
      //   },
      //   data: { status: 'CANCELLED' },
      // });

      return updatedSwap;
    });
  }

  async staffRejectSwap(swapId: string) {
    return this.prisma.$transaction(async (tx) => {
      const swap = await tx.swapRequests.findUnique({
        where: { id: swapId },
      });

      if (!swap) throw new NotFoundException();

      // revert assignment back
      await tx.shiftAssignments.update({
        where: {
          shiftId_userId: {
            shiftId: swap.shiftId,
            userId: swap.requesterId,
          },
        },
        data: {
          status: 'ASSIGNED',
        },
      });
      const result = await tx.swapRequests.update({
        where: { id: swapId },
        data: {
          status: 'REJECTED',
        },
      });
      console.log('see the updated swap request result ', result);
      return result;
    });
  }
}
