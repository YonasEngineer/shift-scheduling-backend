import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LocalAuthGuard } from './guards/passport-local.guard.js';
// import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // LOGIN
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    // console.log('see the req', req);
    return this.authService.login(req.user);
  }

  // // PROTECTED ROUTE
  // @UseGuards(JwtAuthGuard)
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return req.user;
  // }
}
