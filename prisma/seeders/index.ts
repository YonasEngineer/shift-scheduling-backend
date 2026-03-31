import {
  PrismaClient,
  Role,
  UserLocationRole,
} from '../../generated/prisma/client.js';
import 'dotenv/config';
import pkg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

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
  await prisma.availabilityRecurring.createMany({
    data: [
      {
        userId: staff1.id,
        dayOfWeek: 1,
        startTime: new Date('1970-01-01T09:00:00Z'),
        endTime: new Date('1970-01-01T17:00:00Z'),
        timezone: 'America/Los_Angeles',
      },
      {
        userId: staff2.id,
        dayOfWeek: 2,
        startTime: new Date('1970-01-01T10:00:00Z'),
        endTime: new Date('1970-01-01T18:00:00Z'),
        timezone: 'America/Los_Angeles',
      },
      {
        userId: staff3.id,
        dayOfWeek: 1,
        startTime: new Date('1970-01-01T12:00:00Z'),
        endTime: new Date('1970-01-01T20:00:00Z'),
        timezone: 'America/New_York',
      },
    ],
  });

  // =========================
  // 7. AVAILABILITY EXCEPTIONS
  // =========================
  await prisma.availabilityException.createMany({
    data: [
      {
        userId: staff1.id,
        date: new Date('2026-04-08'),
        startTime: new Date('1970-01-01T00:00:00Z'),
        endTime: new Date('1970-01-01T23:59:59Z'),
        isAvailable: false, // full day off (sick/vacation)
      },
      {
        userId: staff2.id,
        date: new Date('2026-04-09'),
        startTime: new Date('1970-01-01T14:00:00Z'),
        endTime: new Date('1970-01-01T18:00:00Z'),
        isAvailable: true, // partial override availability
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
