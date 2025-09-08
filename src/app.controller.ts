import { Controller, Get, Header, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppService } from './app.service';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { CategoriesService } from './categories/categories.service';
import { ProductsService } from './Products/Products.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get()
  handleRoot(@Req() req: Request, @Res() res: Response) {
    if (req.oidc && req.oidc.isAuthenticated()) {
      res.redirect('https://www.elparcheplotter.studio/callback');
    } else {
      res.send(this.appService.getHello());
    }
  }
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async getSitemap(@Res() res: Response) {
    const hostname = 'https://elparcheplotter.studio';
    const smStream = new SitemapStream({ hostname });

    // 1. Añadir URLs estáticas
    const staticLinks = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/productos', changefreq: 'daily', priority: 0.9 },
      // Añade aquí otras páginas estáticas que tengas (ej. /contacto, /nosotros)
    ];
    staticLinks.forEach((link) => smStream.write(link));

    // 2. Añadir URLs de Categorías
    const categories = await this.categoriesService.findAll();
    categories.forEach((category) => {
      smStream.write({
        url: `/productos/category/${category.name}`, // Asegúrate que esta sea la ruta correcta en tu frontend
        changefreq: 'weekly',
        priority: 0.8,
      });
    });

    // 3. Añadir URLs de Productos
    const products = await this.productsService.getProducts(); // Obtiene todos los productos
    products.forEach((product) => {
      smStream.write({
        url: `/productos/${product.id}`, // Asegúrate que esta sea la ruta correcta en tu frontend
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

    smStream.end();

    const sitemap = await streamToPromise(Readable.from(smStream)).then(
      (data) => data.toString(),
    );

    res.send(sitemap);
  }
}
