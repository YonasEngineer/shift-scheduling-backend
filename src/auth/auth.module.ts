import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/passport-local.starategy.js';
import { JwtStrategy } from './strategies/jwt-access.strategy.js';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // JwtModule.register({
    //   global: true,
    //   // secret: 'secretKey',
    //   signOptions: { expiresIn: '1h' },
    // }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<number>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
