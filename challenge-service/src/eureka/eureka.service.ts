import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Eureka } from 'eureka-js-client';

@Injectable()
export class EurekaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EurekaService.name);
  private client!: Eureka;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const eurekaHost = this.configService.get<string>(
      'EUREKA_HOST',
      'localhost',
    );
    const eurekaPort = this.configService.get<number>('EUREKA_PORT', 8761);
    const serviceName = this.configService.get<string>(
      'EUREKA_SERVICE_NAME',
      'challenge-service',
    );
    const instanceHost = this.configService.get<string>(
      'EUREKA_INSTANCE_HOST',
      'localhost',
    );
    const instancePort = this.configService.get<number>(
      'EUREKA_INSTANCE_PORT',
      3002,
    );

    this.client = new Eureka({
      instance: {
        app: serviceName.toUpperCase(),
        instanceId: `${instanceHost}:${serviceName}:${instancePort}`,
        hostName: instanceHost,
        ipAddr: instanceHost,
        port: {
          $: instancePort,
          '@enabled': true,
        },
        vipAddress: serviceName,
        dataCenterInfo: {
          '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
          name: 'MyOwn',
        },
        statusPageUrl: `http://${instanceHost}:${instancePort}/info`,
        healthCheckUrl: `http://${instanceHost}:${instancePort}/health`,
        homePageUrl: `http://${instanceHost}:${instancePort}/`,
      },
      eureka: {
        host: eurekaHost,
        port: eurekaPort,
        servicePath: '/eureka/apps/',
        maxRetries: 10,
        requestRetryDelay: 2000,
      },
    });

    this.client.start((error: Error) => {
      if (error) {
        this.logger.error(`Eureka registration failed: ${error.message}`);
      } else {
        this.logger.log(`Registered with Eureka as ${serviceName}`);
      }
    });
  }

  onModuleDestroy(): void {
    if (this.client) {
      this.client.stop();
      this.logger.log('Deregistered from Eureka');
    }
  }

  getServiceUrl(serviceName: string): string | null {
    try {
      const instances = this.client.getInstancesByAppId(
        serviceName.toUpperCase(),
      );

      if (instances && instances.length > 0) {
        const instance = instances[0];
        const port =
          typeof instance.port === 'object' ? instance.port : instance.port;
        return `http://${instance.hostName}:${port}`;
      }

      return null;
    } catch (error: any) {
      this.logger.warn(
        `Could not resolve ${serviceName} from Eureka: ${error.message}`,
      );
      return null;
    }
  }
}
