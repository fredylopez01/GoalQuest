import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClientsModule } from 'src/clients/clients.module';

@Module({
  imports: [PrismaModule, ClientsModule],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
