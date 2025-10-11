import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import type { User } from '@clerk/backend';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('me')
  getProfile(@CurrentUser() user: User) {
    return user;
  }
}
