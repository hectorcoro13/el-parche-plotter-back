import { Controller, Get, Header, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppService } from './app.service';
import { SitemapStream } from 'sitemap';
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

    try {
      // Conectamos el generador de sitemap directamente a la respuesta.
      // Esto asegura que el formato XML se transmita correctamente.
      smStream.pipe(res);

      // 1. Añadir URLs estáticas
      smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
      smStream.write({ url: '/productos', changefreq: 'daily', priority: 0.9 });

      // 2. Añadir URLs de Categorías
      const categories = await this.categoriesService.findAll();
      categories.forEach((category) => {
        smStream.write({
          url: `/productos/category/${category.name}`,
          changefreq: 'weekly',
          priority: 0.8,
        });
      });

      // 3. Añadir URLs de Productos
      const products = await this.productsService.getProducts();
      products.forEach((product) => {
        smStream.write({
          url: `/productos/${product.id}`,
          changefreq: 'weekly',
          priority: 0.7,
        });
      });

      // Finalizamos el stream. ¡Importante!
      smStream.end();
    } catch (error) {
      console.error('Error al generar el sitemap:', error);
      // En caso de un error, nos aseguramos de no dejar la conexión abierta.
      if (!res.headersSent) {
        res.status(500).end();
      }
    }
  }
}
