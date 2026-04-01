import { SwapRequestType } from 'generated/prisma/enums.js';

export class CreateSwapDto {
  shiftId: string;
  type: SwapRequestType; // SWAP | DROP
  targetUserId?: string; // required if SWAP
  // expiresAt: Date;
}
