import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { IdentityClient } from './identitiy.client';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
    }),
    ConfigModule,
  ],
  providers: [IdentityClient],
  exports: [IdentityClient],
})
export class ClientsModule {}
