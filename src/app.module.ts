import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { LoggerModule } from 'nestjs-pino';
import { StorageModule, StorageProviderType } from './storage';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // avaliable everywhere you don't have to add it to each module
      envFilePath: '.env',
    }),

    // pino logger
    // for dev it will do pretty logging and colorized for better debugging
    // for production it will use JSON and only informational data
    // auto logging for logging every req and response
    // replace the sensitive data like auth/cookies with [Redacted]
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          transport:
            configService.get('NODE_ENV') !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                  },
                }
              : undefined,
          level:
            configService.get('NODE_ENV') !== 'production' ? 'debug' : 'info',
          autoLogging: true,
          // redact sensitive data
          redact: ['req.headers.authorization', 'req.headers.cookie'],
        },
      }),
      inject: [ConfigService],
    }),

    // database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get('DB_NAME', 'db.sqlite'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') !== 'production', // for safty
      }),
      inject: [ConfigService],
    }),

    // Cloud storage (S3/R2)
    // Set STORAGE_PROVIDER to 's3' or 'r2' in your .env file
    StorageModule.forRootAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        provider:
          (configService.get<string>(
            'STORAGE_PROVIDER',
          ) as StorageProviderType) || StorageProviderType.S3,
        endpoint: configService.get<string>('STORAGE_ENDPOINT'),
        region: configService.get<string>('STORAGE_REGION') || 'us-east-1',
        accessKeyId: configService.get<string>('STORAGE_ACCESS_KEY') || '',
        secretAccessKey: configService.get<string>('STORAGE_SECRET_KEY') || '',
        bucket: configService.get<string>('STORAGE_BUCKET') || '',
        publicUrl: configService.get<string>('STORAGE_PUBLIC_URL'),
      }),
      inject: [ConfigService],
    }),

    PassportModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // global auth guard
    // use @Public() decorator to make routes public if you want
    // it depends on your website logic if it's free acces mostly
    // or mostly a must login to access
    // just remove the provider APP_GUARD To remove the global guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
