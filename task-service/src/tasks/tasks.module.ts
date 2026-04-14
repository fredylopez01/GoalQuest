import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClientsModule } from 'src/clients/clients.module';
import { GoalsModule } from 'src/goals/goals.module';

@Module({
  imports: [PrismaModule, ClientsModule, GoalsModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
