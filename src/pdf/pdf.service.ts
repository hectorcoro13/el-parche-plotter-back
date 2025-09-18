import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as path from 'path';

@Injectable()
export class PdfService {
  async generateInvoice(data: any): Promise<Buffer> {
    const templatePath = path.resolve(
      process.cwd(), // Usamos process.cwd() para la ruta base del proyecto
      'src',
      'mail',
      'templates',
      'order-confirmation.hbs',
    );
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    const template = handlebars.compile(templateHtml);
    const html = template(data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Opciones importantes para producción/Docker
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return Buffer.from(pdfBuffer);
  }
}
