// swap.controller.ts
import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { SwampService } from './swamp.service.js';
import { CreateSwapDto } from './swamp.dto.js';

@Controller('swaps')
export class SwampController {
  constructor(private readonly swapService: SwampService) {}

  // CREATE SWAP
  @Post(':userId')
  createSwap(@Param('userId') userId: string, @Body() dto: CreateSwapDto) {
    return this.swapService.createSwap(userId, dto);
  }

  //  GET MY SWAPS
  @Get(':userId')
  getMySwaps(@Param('userId') userId: string) {
    return this.swapService.getMySwaps(userId);
  }

  // GET ONE
  @Get(':id')
  getSwap(@Param('id') id: string) {
    return this.swapService.getSwapById(id);
  }
}
