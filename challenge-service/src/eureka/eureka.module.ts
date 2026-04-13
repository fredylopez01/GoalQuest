import { Global, Module } from '@nestjs/common';
import { EurekaService } from './eureka.service';

@Global()
@Module({
  providers: [EurekaService],
  exports: [EurekaService],
})
export class EurekaModule {}
