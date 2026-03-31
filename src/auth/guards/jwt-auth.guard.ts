import {
  Injectable,
  // ExecutionContext,
  // UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
// import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
