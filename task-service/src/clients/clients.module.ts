import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { IdentityClient } from './identitiy.client';
import { GamificationClient } from './gamification.client';
import { ChallengeClient } from './challange.client';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
    }),
    ConfigModule,
  ],
  providers: [IdentityClient, GamificationClient, ChallengeClient],
  exports: [IdentityClient, GamificationClient, ChallengeClient],
})
export class ClientsModule {}
