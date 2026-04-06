// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';

//  JWT payload (what goes inside the token)
type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  // locationIds: string[];
};

//  User shape returned from validateUser (from DB)
type AuthUser = {
  id: string;
  email: string;
  role: string;
  passwordHash: string;
  userLocations: { locationId: string }[];
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Validate user credentials
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<AuthUser, 'passwordHash'>> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userLocations: {
          select: {
            locationId: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // remove passwordHash before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;

    return result;
  }

  // Generate JWT
  login(user: Omit<AuthUser, 'passwordHash'>) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      // locationIds: user.userLocations.map((ul) => ul.locationId),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: payload,
    };
  }
}
