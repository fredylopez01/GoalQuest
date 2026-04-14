import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { GoalsModule } from './goals/goals.module';
import { TasksModule } from './tasks/tasks.module';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule } from './clients/clients.module';
import { EurekaModule } from './eureka/eureka.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    GoalsModule,
    TasksModule,
    ClientsModule,
    EurekaModule,
  ],
})
export class AppModule {}
