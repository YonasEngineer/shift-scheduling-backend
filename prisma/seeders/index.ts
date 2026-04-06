import {
  PrismaClient,
  Role,
  UserLocationRole,
} from '../../generated/prisma/client.js';
import 'dotenv/config';
import pkg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
// import { BadRequestException } from '@nestjs/common';

// const prisma = new PrismaClient();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // This is often required for Render/Heroku/DigitalOcean
  },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const password = await bcrypt.hash('Test@123', 10);
async function main() {
  // const deleted = await prisma.swapRequests.deleteMany({});
  // console.log('Deleted swap requests:', deleted.count);

  // await prisma.shiftAssignments.updateMany({
  //   where: { userId: '8a7feb97-1697-4fce-b9d2-200129ca5019' },
  //   data: { status: 'ASSIGNED' },
  // });
  // console.log('assignment deleted');
  // throw new BadRequestException();

  // 🔥 0. CLEAN DATABASE FIRST
  await prisma.userSkill.deleteMany();
  await prisma.userLocation.deleteMany();
  await prisma.availabilityException.deleteMany();
  await prisma.availabilityRecurring.deleteMany();
  await prisma.swapRequests.deleteMany();
  await prisma.shiftAssignments.deleteMany();
  await prisma.shifts.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();
  await prisma.skill.deleteMany();
  console.log('deleting completed');
  // =========================
  // 1. SKILLS
  // =========================
  const skills = await prisma.skill.createMany({
    data: [
      { name: 'bartender' },
      { name: 'cook' },
      { name: 'server' },
      { name: 'host' },
    ],
  });

  const [bartender, cook, server, host] = await prisma.skill.findMany();

  // =========================
  // 2. LOCATIONS (2 TIMEZONES)
  // =========================
  const locations = await prisma.location.createMany({
    data: [
      {
        name: 'Coastal Eats - San Francisco',
        timezone: 'America/Los_Angeles',
        address: 'SF Downtown',
      },
      {
        name: 'Coastal Eats - Los Angeles',
        timezone: 'America/Los_Angeles',
        address: 'LA Center',
      },
      {
        name: 'Coastal Eats - New York',
        timezone: 'America/New_York',
        address: 'Manhattan',
      },
      {
        name: 'Coastal Eats - Miami',
        timezone: 'America/New_York',
        address: 'Miami Beach',
      },
    ],
  });

  const [sf, la, ny, miami] = await prisma.location.findMany();

  // =========================
  // 3. USERS
  // =========================

  const admin = await prisma.user.create({
    data: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@coastal.com',
      passwordHash: password,
      role: Role.ADMIN,
    },
  });

  const managerSF = await prisma.user.create({
    data: {
      firstName: 'Alice',
      lastName: 'SFManager',
      email: 'alice@sf.com',
      passwordHash: password,
      role: Role.MANAGER,
    },
  });

  const managerNY = await prisma.user.create({
    data: {
      firstName: 'Bob',
      lastName: 'NYManager',
      email: 'bob@ny.com',
      passwordHash: password,
      role: Role.MANAGER,
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@staff.com',
      passwordHash: password,
      role: Role.STAFF,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      firstName: 'Maria',
      lastName: 'Lopez',
      email: 'maria@staff.com',
      passwordHash: password,
      role: Role.STAFF,
    },
  });

  const staff3 = await prisma.user.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Kim',
      email: 'sarah@staff.com',
      passwordHash: password,
      role: Role.STAFF,
    },
  });

  const staff4 = await prisma.user.create({
    data: {
      firstName: 'David',
      lastName: 'Chen',
      email: 'david@staff.com',
      passwordHash: password,
      role: Role.STAFF,
    },
  });

  // =========================
  // 4. USER LOCATIONS (CERTIFICATIONS)
  // =========================
  await prisma.userLocation.createMany({
    data: [
      // Admin not assigned to locations (optional)

      // Managers
      {
        userId: managerSF.id,
        locationId: sf.id,
        role: UserLocationRole.MANAGER,
        isCertified: true,
      },
      {
        userId: managerNY.id,
        locationId: ny.id,
        role: UserLocationRole.MANAGER,
        isCertified: true,
      },

      // Staff certifications
      {
        userId: staff1.id,
        locationId: sf.id,
        role: UserLocationRole.STAFF,
        isCertified: true,
      },
      {
        userId: staff1.id,
        locationId: ny.id,
        role: UserLocationRole.STAFF,
        isCertified: true,
      },

      {
        userId: staff2.id,
        locationId: sf.id,
        role: UserLocationRole.STAFF,
        isCertified: true,
      },
      {
        userId: staff2.id,
        locationId: la.id,
        role: UserLocationRole.STAFF,
        isCertified: true,
      },

      {
        userId: staff3.id,
        locationId: ny.id,
        role: UserLocationRole.STAFF,
        isCertified: true,
      },
      {
        userId: staff3.id,
        locationId: miami.id,
        role: UserLocationRole.STAFF,
        isCertified: true,
      },

      {
        userId: staff4.id,
        locationId: la.id,
        role: UserLocationRole.STAFF,
        isCertified: true,
      },
      {
        userId: staff4.id,
        locationId: sf.id,
        role: UserLocationRole.STAFF,
        isCertified: true,
      },
    ],
  });

  // =========================
  // 5. USER SKILLS
  // =========================
  await prisma.userSkill.createMany({
    data: [
      { userId: staff1.id, skillId: bartender.id },
      { userId: staff1.id, skillId: server.id },

      { userId: staff2.id, skillId: server.id },
      { userId: staff2.id, skillId: host.id },

      { userId: staff3.id, skillId: cook.id },

      { userId: staff4.id, skillId: bartender.id },
      { userId: staff4.id, skillId: cook.id },
    ],
  });

  // =========================
  // 6. AVAILABILITY (RECURRING)
  // =========================
  // await prisma.availabilityRecurring.createMany({
  //   data: [
  //     {
  //       userId: staff1.id,
  //       dayOfWeek: 3,
  //       startTime: new Date('1970-01-01T14:00:00Z'), // 2pm  local, Prisma wants a Date object to extract the time
  //       endTime: new Date('1970-01-01T17:00:00Z'), // 5pm local
  //       timezone: 'America/Los_Angeles',
  //     },
  //     {
  //       userId: staff2.id,
  //       dayOfWeek: 3,
  //       startTime: new Date('1970-01-01T18:00:00Z'), // 6pm local
  //       endTime: new Date('1970-01-01T20:00:00Z'), // 8pm local
  //       timezone: 'America/Los_Angeles',
  //     },
  //     {
  //       userId: staff3.id,
  //       dayOfWeek: 4,
  //       startTime: new Date('1970-01-01T21:00:00Z'), // 9pm local
  //       endTime: new Date('1970-01-01T23:00:00Z'), // 11pm local
  //       timezone: 'America/New_York',
  //     },
  //   ],
  // });
  // =========================
  // 6. AVAILABILITY (RECURRING)
  // =========================
  await prisma.availabilityRecurring.createMany({
    data: [
      {
        userId: staff1.id,
        dayOfWeek: 1,
        startTime: '11:00', // 11:00 AM
        endTime: '18:00', // 6:00 PM
        timezone: 'America/Los_Angeles',
      },
      {
        userId: staff2.id,
        dayOfWeek: 1,
        startTime: '11:00', // 11:00 AM
        endTime: '20:00', // 8:00 PM
        timezone: 'America/Los_Angeles',
      },
      {
        userId: staff3.id,
        dayOfWeek: 1,
        startTime: '21:00', // 9:00 PM
        endTime: '23:00', // 11:00 PM
        timezone: 'America/New_York',
      },
    ],
  });
  // =========================
  // 7. AVAILABILITY EXCEPTIONS
  // =========================
  // await prisma.availabilityException.createMany({
  //   data: [
  //     {
  //       userId: staff1.id,
  //       date: new Date('2026-04-08'),
  //       startTime: new Date('1970-01-01T18:00:00Z'), // 6 PM Local
  //       endTime: new Date('1970-01-01T20:00:00Z'), // 8 PM Local
  //       isAvailable: false,
  //     },
  //     {
  //       userId: staff2.id,
  //       date: new Date('2026-04-09'),
  //       startTime: new Date('1970-01-01T14:00:00Z'), // 2 PM Local
  //       endTime: new Date('1970-01-01T17:00:00Z'), // 5 PM Local
  //       isAvailable: false,
  //     },
  //   ],
  // });

  // =========================
  // 7. AVAILABILITY EXCEPTIONS
  // =========================
  await prisma.availabilityException.createMany({
    data: [
      {
        userId: staff1.id,
        date: new Date('2026-04-08'),
        startTime: '18:00',
        endTime: '20:00',
        isAvailable: false,
      },
      {
        userId: staff2.id,
        date: new Date('2026-04-09'),
        startTime: '14:00',
        endTime: '17"00',
        isAvailable: false,
      },
    ],
  });
  console.log('Seed completed successfully (core entities only)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
