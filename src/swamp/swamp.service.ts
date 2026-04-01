// swap.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
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
}
