// swap.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Query,
} from '@nestjs/common';
import { SwampService } from './swamp.service.js';
import { CreateSwapDto } from './swamp.dto.js';

@Controller('swaps')
export class SwampController {
  constructor(private readonly swapService: SwampService) {}

  // Approve
  @Post('approve')
  approve(
    @Query('managerId') managerId: string,
    @Query('swapId') swapId: string,
  ) {
    console.log('see the managerId', managerId);
    return this.swapService.managerApproveSwap(swapId, managerId);
  }

  // CREATE SWAP
  @Post(':userId')
  createSwap(@Param('userId') userId: string, @Body() dto: CreateSwapDto) {
    return this.swapService.createSwap(userId, dto);
  }

  // GET ONE
  @Get('needing/approval/:locationId')
  getSwap(@Param('locationId') locationId: string) {
    console.log('see the locationId', locationId);
    return this.swapService.swampNeedingApproval(locationId);
  }

  //  GET MY SWAPS
  @Get(':userId')
  getMySwaps(@Param('userId') userId: string) {
    return this.swapService.getMySwaps(userId);
  }

  @Patch(':swapId/reject/manager')
  rejectSwapByManager(
    @Param('swapId') swapId: string,
    @Body('managerId') managerId: string,
  ) {
    return this.swapService.managerRejectSwap(swapId, managerId);
  }

  @Patch(':swapId/reject/staff')
  rejectSwap(@Param('swapId') swapId: string) {
    return this.swapService.staffRejectSwap(swapId);
  }

  @Patch(':swapId/accept')
  acceptSwap(@Param('swapId') swapId: string, @Body('userId') userId: string) {
    return this.swapService.staffAcceptSwap(swapId, userId);
  }
}
