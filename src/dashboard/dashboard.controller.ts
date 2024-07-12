/* eslint-disable prettier/prettier */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PublicGuard } from 'src/guard/public.guard';
import { AllowAnyRole } from 'src/decorators/allow-any-role.decorator';

@Controller('dashboard')
@UseGuards(PublicGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  
  @Get('count-month')
  @AllowAnyRole()
  count() {
    return this.dashboardService.count();
  }

  @Get('graph')
  @AllowAnyRole()
  graph() {
    return this.dashboardService.graph();
  }
}
