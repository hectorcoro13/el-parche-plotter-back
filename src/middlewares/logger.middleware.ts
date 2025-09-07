import { NextFunction, Request, Response } from 'express';

export function globalMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const timeDate = new Date().toLocaleString();
  console.log(
    `Estas ejecutando un metodo ${req.method} en la ruta ${req.url} con fecha y hora ${timeDate}`,
  );
  next();
}
