import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from 'src/Auth/Auth.guard';
import { RolesGuard } from 'src/Auth/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { role } from 'src/roles.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('dashboard')
@ApiBearerAuth()
@Roles(role.Admin)
@UseGuards(AuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }
}
