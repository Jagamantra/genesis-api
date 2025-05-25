import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { User, UserDocument, UserRole } from '../../auth/schemas/user.schema';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedException(
        'Authentication token not found in cookies or headers',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      // Just check if the user exists and is active
      const user = await this.userModel
        .findOne({
          _id: payload.sub,
          isVerified: true,
        })
        .exec();

      if (!user) {
        throw new UnauthorizedException(
          'Token is invalid, expired, or revoked',
        );
      }

      request['user'] = payload;

      // Check roles
      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!requiredRoles) {
        return true;
      }

      const userRole = payload.role;
      return (
        userRole === UserRole.ADMIN ||
        requiredRoles.some((role) => role === userRole)
      );
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromRequest(request: Request): string | undefined {
    // First try to get token from cookies
    const cookieToken = request.cookies?.access_token;
    if (cookieToken && typeof cookieToken === 'string') {
      return cookieToken;
    }

    // Fallback to Authorization header
    const authorization = request.headers.authorization;
    if (!authorization) {
      return undefined;
    }

    const [type, headerToken] = authorization.split(' ');
    if (type !== 'Bearer' || !headerToken) {
      return undefined;
    }

    return headerToken;
  }
}
