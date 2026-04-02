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
    await this.prisma.shiftAssignments.update({
      where: {
        shiftId_userId: { shiftId, userId },
      },
      data: {
        status: 'PENDING_SWAP',
      },
    });

    //  Create swap
    const result = this.prisma.swapRequests.create({
      data: {
        shiftId,
        requesterId: userId,
        targetUserId: targetUserId || null,
        type,
        expiresAt,
      },
    });
    // console.log('see the result', result);
    return result;
  }

  // GET ALL SWAPS (for user)
  async getMySwaps(userId: string) {
    return this.prisma.swapRequests.findMany({
      where: {
        OR: [{ requesterId: userId }, { targetUserId: userId }],
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

  async acceptSwap(swapId: string, targetUserId: string) {
    // 1. Fetch the swap request with its details
    const swap = await this.prisma.swapRequests.findUnique({
      where: { id: swapId },
      include: { shift: true },
    });

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
          approvedAt: new Date(),
        },
      });

      // B. Remove the old assignment from the requester
      await tx.shiftAssignments.delete({
        where: {
          shiftId_userId: {
            shiftId: swap.shiftId,
            userId: swap.requesterId,
          },
        },
      });

      // C. Create the new assignment for the target user
      await tx.shiftAssignments.create({
        data: {
          shiftId: swap.shiftId,
          userId: targetUserId,
          status: 'ASSIGNED',
        },
      });

      // D. (Optional) Invalidate other pending swaps for this specific shift assignment
      // This prevents the same shift from being swapped multiple times simultaneously
      await tx.swapRequests.updateMany({
        where: {
          shiftId: swap.shiftId,
          requesterId: swap.requesterId,
          status: 'PENDING',
          id: { not: swapId },
        },
        data: { status: 'CANCELLED' },
      });

      return updatedSwap;
    });
  }
}
