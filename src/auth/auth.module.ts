import { Module } from '@nestjs/common';

import { PassportModule } from '@nestjs/passport';
import { ClerkClientProvider } from 'src/providers/clerk-client.provider';
import { ConfigModule } from '@nestjs/config';
import { ClerkStrategy } from './strategies/clerk.strategy';

@Module({
  imports: [PassportModule, ConfigModule],
  providers: [ClerkStrategy, ClerkClientProvider],
  exports: [PassportModule],
})
export class AuthModule {}
