// staff.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  AvailabilityRecurring,
  Prisma,
  Shifts,
  //   ShiftAssignments,
} from 'generated/prisma/browser.js';
// import  {ShiftAssignments }

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    shiftAssignments: {
      include: { shift: true };
    };
    userAvailabilities: true;
  };
}>;

// type ShiftType = Prisma.ShiftsGetPayload<{}>;
@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async getAvailableStaff(
    locationId: string,
    skillId: string,
    shiftStart: Date,
    shiftEnd: Date,
  ) {
    console.log('we are here', shiftStart);
    // STEP 1: Fetch eligible staff (DB-level filtering)
    const staff = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: 'STAFF',
        userLocations: {
          some: { locationId },
        },
        userSkills: {
          some: { skillId },
        },
      },
      include: {
        shiftAssignments: {
          include: {
            shift: true,
          },
        },
        userAvailabilities: true,
      },
    });

    console.log('see the staff', staff);
    //  STEP 2: Apply business rules (logic filtering)
    const validStaff = staff.filter((user: UserWithRelations) => {
      // 1.  Check overlapping shifts
      const hasConflict = user.shiftAssignments.some((a) =>
        this.hasOverlap(a.shift, shiftStart, shiftEnd),
      );
      console.log('see the hasConflict', hasConflict);
      if (hasConflict) return false;

      // 2.  Check 10-hour rest rule
      const violatesRest = user.shiftAssignments.some((a) =>
        this.violatesRest(a.shift, shiftStart),
      );
      console.log('see the  violatesRest', violatesRest);
      if (violatesRest) return false;

      // 3.  Check availability
      const available = this.isAvailable(user, shiftStart, shiftEnd);
      console.log('see available', available);
      if (!available) return false;

      return true;
    });

    //  STEP 3: Return filtered staff
    return validStaff.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    }));
  }

  //  Rule 1: Overlapping shifts
  private hasOverlap(existingShift: Shifts, newStart: Date, newEnd: Date) {
    return (
      newStart < new Date(existingShift?.endTime) &&
      newEnd > new Date(existingShift?.startTime)
    );
  }

  //  Rule 2: Minimum 10-hour rest
  private violatesRest(existingShift: Shifts, newStart: Date) {
    if (!existingShift) return false;

    const TEN_HOURS = 10 * 60 * 60 * 1000;

    const diff = newStart.getTime() - new Date(existingShift.endTime).getTime();

    return diff < TEN_HOURS;
  }

  // Rule 3: Availability check (basic version)
  private isAvailable(
    user: { userAvailabilities: AvailabilityRecurring[] },
    newStart: Date,
    newEnd: Date,
  ): boolean {
    // Fix day mapping
    console.log('see the staff', user);
    console.log('see the newStart', newStart);
    console.log('see the newEnd', newEnd);

    const day = newStart.getDay() === 0 ? 7 : newStart.getDay();
    console.log('see the day', day);
    return user.userAvailabilities.some((a) => {
      console.log('se dayOfWeek ', a.dayOfWeek);
      if (a.dayOfWeek !== day) return false;

      const shiftStartMinutes =
        newStart.getUTCHours() * 60 + newStart.getUTCMinutes();

      const shiftEndMinutes =
        newEnd.getUTCHours() * 60 + newEnd.getUTCMinutes();

      const availStartMinutes =
        a.startTime.getUTCHours() * 60 + a.startTime.getUTCMinutes();

      const availEndMinutes =
        a.endTime.getUTCHours() * 60 + a.endTime.getUTCMinutes();

      return (
        shiftStartMinutes >= availStartMinutes &&
        shiftEndMinutes <= availEndMinutes
      );
    });
  }
}
