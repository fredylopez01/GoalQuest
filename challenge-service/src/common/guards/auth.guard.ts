import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);

    try {
      const identityUrl = this.configService.get<string>(
        'IDENTITY_SERVICE_URL',
      );

      const { data } = await firstValueFrom(
        this.httpService.post(`${identityUrl}/auth/validate-token`, {
          token,
        }),
      );

      if (!data.valid) {
        throw new UnauthorizedException({
          statusCode: 401,
          error: 'UNAUTHORIZED',
          message: 'Invalid token',
        });
      }

      const user: AuthenticatedUser = {
        user_id: data.user_id,
        email: data.email,
        rol: data.rol,
      };

      request.user = user;
      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Token validation failed: ${error.message}`);
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Could not validate token',
      });
    }
  }
}
