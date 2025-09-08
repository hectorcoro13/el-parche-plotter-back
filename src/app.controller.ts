import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  handleRoot(@Req() req: Request, @Res() res: Response) {
    if (req.oidc && req.oidc.isAuthenticated()) {
      res.redirect('https://www.elparcheplotter.studio/callback');
    } else {
      res.send(this.appService.getHello());
    }
  }
}
