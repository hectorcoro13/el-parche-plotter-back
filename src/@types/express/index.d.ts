// src/@types/express/index.d.ts

// Importa los tipos originales de express-openid-connect
import { OpenidRequest } from 'express-openid-connect';

// Extiende la interfaz Request de Express
declare global {
  namespace Express {
    export interface Request {
      // Añade la propiedad 'oidc' a la interfaz Request
      oidc: OpenidRequest;
    }
  }
}
