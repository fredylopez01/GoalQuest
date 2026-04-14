import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ValidatedUser } from 'src/clients/identitiy.client';

export const CurrentUser = createParamDecorator(
  (data: keyof ValidatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as ValidatedUser;

    // Si pides un campo específico: @CurrentUser('userId')
    if (data) {
      return user[data];
    }

    // Si no: @CurrentUser() retorna todo el objeto
    return user;
  },
);
