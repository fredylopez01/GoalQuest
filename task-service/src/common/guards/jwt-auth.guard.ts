import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { IdentityClient } from 'src/clients/identitiy.client';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly identityClient: IdentityClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const user = await this.identityClient.validateToken(token);

    if (!user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // Inyecta el usuario validado en el request
    request.user = user;

    return true;
  }

  private extractToken(request: any): string | null {
    const authorization = request.headers['authorization'];

    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
