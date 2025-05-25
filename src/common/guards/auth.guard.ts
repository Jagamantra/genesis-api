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
import { mockUsers } from '../../auth/config/mock-users.config';

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
      // Check if it's a mock user
      const mockUser = mockUsers.find(u => u._id === payload.sub);
      if (mockUser) {
        if (!mockUser.isVerified) {
          throw new UnauthorizedException('User is not verified');
        }
        request['user'] = { ...payload, isMockUser: true };
        return true;
      }

      // Regular user check
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
    console.log('Cookies:', request.cookies);
    console.log('Headers:', request.headers);
    
    // First try to get token from cookies
    const cookieToken = request.cookies?.access_token;
    if (cookieToken && typeof cookieToken === 'string') {
      console.log('Using token from cookies');
      return cookieToken;
    }

    // Fallback to Authorization header
    const authorization = request.headers.authorization;
    if (!authorization) {
      console.log('No authorization header found');
      return undefined;
    }

    const [type, headerToken] = authorization.split(' ');
    if (type !== 'Bearer' || !headerToken) {
      console.log('Invalid authorization header format');
      return undefined;
    }

    console.log('Using token from Authorization header');
    return headerToken;
  }
}
