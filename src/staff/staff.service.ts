// staff.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  // AvailabilityRecurring,
  Prisma,
  Shifts,
  //   ShiftAssignments,
} from 'generated/prisma/browser.js';
import { DateTime } from 'luxon';

// import  {ShiftAssignments }
type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    shiftAssignments: {
      include: { shift: true };
    };
    recurringAvailabilities: true;
    availabilityExceptions: true;
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
    console.log('let see the shift start here', shiftStart);
    console.log('let see the shift end here', shiftEnd);

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
        recurringAvailabilities: true,
        availabilityExceptions: true,
      },
    });
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });
    if (!location) return;
    console.log('see the available staff', staff);
    //  STEP 2: Apply business rules (logic filtering)
    const validStaff = staff.filter((user: UserWithRelations) => {
      // 1.  Check overlapping shifts
      const hasConflict = user.shiftAssignments.some((a) =>
        this.hasOverlap(a.shift, shiftStart, shiftEnd),
      );
      console.log('Is hasConflict', hasConflict);
      if (hasConflict) return false;

      // 2.  Check 10-hour rest rule
      const violatesRest = user.shiftAssignments.some((a) =>
        this.violatesRest(a.shift, shiftStart),
      );
      console.log('see the  violatesRest', violatesRest);
      if (violatesRest) return false;

      // 3.  Check availability
      const available = this.isAvailable(
        user,
        shiftStart,
        shiftEnd,
        location?.timezone,
      );
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
    // If there's no existing shift to compare to, there can't be an overlap
    if (!existingShift?.startTime || !existingShift?.endTime) {
      return false;
    }
    const existingStart = new Date(existingShift.startTime).getTime();
    const existingEnd = new Date(existingShift.endTime).getTime();
    const requestStart = newStart.getTime();
    const requestEnd = newEnd.getTime();

    return requestStart < existingEnd && requestEnd > existingStart;
  }

  //  Rule 2: Minimum 10-hour rest
  private violatesRest(existingShift: Shifts, newStart: Date) {
    if (!existingShift) return false;

    const TEN_HOURS = 10 * 60 * 60 * 1000;

    const diff = newStart.getTime() - new Date(existingShift.endTime).getTime();

    return diff < TEN_HOURS;
  }

  // private timeToMinutes(date: Date): number {
  //   return date.getHours() * 60 + date.getMinutes();
  // }

  // Rule 3: Availability check (basic version)
  // private isAvailable(
  //   user: UserWithRelations,
  //   newStart: Date,
  //   newEnd: Date,
  //   location: string,
  // ): boolean {
  //   const shiftDate = newStart.toISOString().split('T')[0];

  //   // 1. Check Exceptions (with time range!)
  //   const exception = user.availabilityExceptions.find(
  //     (e) => new Date(e.date).toISOString().split('T')[0] === shiftDate,
  //   );

  //   if (exception) {
  //     const exStart = this.timeToMinutes(exception.startTime);
  //     const exEnd = this.timeToMinutes(exception.endTime);

  //     const shiftStart = this.timeToMinutes(newStart);
  //     const shiftEnd = this.timeToMinutes(newEnd);

  //     const overlaps = shiftStart < exEnd && shiftEnd > exStart;

  //     if (overlaps) {
  //       return exception.isAvailable;
  //     }
  //   }

  //   // 2. Check Recurring
  //   const day = newStart.getDay() === 0 ? 7 : newStart.getDay();

  //   return user.recurringAvailabilities.some((a) => {
  //     if (a.dayOfWeek !== day) return false;

  //     const availStart = this.timeToMinutes(a.startTime);
  //     const availEnd = this.timeToMinutes(a.endTime);

  //     const shiftStart = this.timeToMinutes(newStart);
  //     const shiftEnd = this.timeToMinutes(newEnd);

  //     return shiftStart >= availStart && shiftEnd <= availEnd;
  //   });
  // }

  // import { DateTime } from 'luxon';

  private isAvailable(
    user: UserWithRelations,
    newStart: Date,
    newEnd: Date,
    locationTimezone: string, // 🔥 REQUIRED
  ): boolean {
    // 1. Convert shift → LOCATION TIMEZONE
    console.log('see the locationTimezone', locationTimezone);
    // console.log('see the newStart come from the frontend ', newStart);
    const shiftStart = DateTime.fromJSDate(newStart).setZone(locationTimezone);
    const shiftEnd = DateTime.fromJSDate(newEnd).setZone(locationTimezone);
    console.log('see the shiftStart local time', shiftStart);
    console.log('see the shiftEnd local time', shiftEnd);

    const shiftDate = shiftStart.toISODate(); // YYYY-MM-DD
    const shiftStartMin = shiftStart.hour * 60 + shiftStart.minute;
    const shiftEndMin = shiftEnd.hour * 60 + shiftEnd.minute;

    // Helper to normalize ranges
    const normalizeRange = (start: number, end: number) => {
      return end <= start ? [start, end + 1440] : [start, end];
    };

    const [normShiftStart, normShiftEnd] = normalizeRange(
      shiftStartMin,
      shiftEndMin,
    );

    // ---------------------------------------
    // 2. Check EXCEPTIONS (HIGHEST PRIORITY)
    // ---------------------------------------
    const exception = user.availabilityExceptions.find(
      (e) =>
        DateTime.fromJSDate(e.date).setZone(locationTimezone).toISODate() ===
        shiftDate,
    );
    console.log('see the exception', exception);

    if (exception) {
      // Full-day exception
      if (!exception.startTime || !exception.endTime) {
        return exception.isAvailable;
      }

      const exStartDT = DateTime.fromJSDate(exception.startTime).setZone(
        locationTimezone,
      );
      const exEndDT = DateTime.fromJSDate(exception.endTime).setZone(
        locationTimezone,
      );

      const exStart = exStartDT.hour * 60 + exStartDT.minute;
      const exEnd = exEndDT.hour * 60 + exEndDT.minute;

      const [normExStart, normExEnd] = normalizeRange(exStart, exEnd);

      const overlaps = normShiftStart < normExEnd && normShiftEnd > normExStart;

      if (overlaps) {
        return exception.isAvailable; // ✅ override
      }
    }

    // ---------------------------------------
    // 3. Check RECURRING AVAILABILITY
    // ---------------------------------------

    const day = shiftStart.weekday;
    console.log('see the day of the shift', day);

    return user.recurringAvailabilities.some((a) => {
      if (a.dayOfWeek !== day) return false;
      console.log('see a ', a);
      // const availStartDT = DateTime.fromJSDate(a.startTime).setZone(
      //   locationTimezone,
      // );
      // const availEndDT = DateTime.fromJSDate(a.endTime).setZone(
      //   locationTimezone,
      // );
      const availStartDT = DateTime.fromFormat(a.startTime, 'HH:mm', {
        zone: locationTimezone,
      });

      const availEndDT = DateTime.fromFormat(a.endTime, 'HH:mm', {
        zone: locationTimezone,
      });

      console.log('see the  availStartDT', availStartDT);
      console.log('see the  availEndDT', availEndDT);

      const availStart = availStartDT.hour * 60 + availStartDT.minute;
      const availEnd = availEndDT.hour * 60 + availEndDT.minute;
      console.log('see the availStartStr', availStart);
      console.log('see the availEndStr', availEnd);
      console.log('see the normShiftEnd', normShiftEnd);
      console.log('see the normShiftStart', normShiftStart);

      const [normAvailStart, normAvailEnd] = normalizeRange(
        availStart,
        availEnd,
      );

      // 3. Compare with your shift (which is already normalized to the location zone)
      return normShiftStart >= normAvailStart && normShiftEnd <= normAvailEnd;
    });
  }
}
