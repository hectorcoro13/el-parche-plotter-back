# ---- Fase de Construcción (Builder) ----
# Usamos una imagen completa de Node.js para instalar dependencias y construir el proyecto.
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Copiamos los archivos de dependencias e instalamos
COPY package*.json ./
RUN npm install

# Copiamos todo el código fuente
COPY . .

# Construimos la aplicación para producción
RUN npm run build

# ---- Fase Final (Runner) ----
# Usamos una imagen más ligera solo para ejecutar la aplicación ya construida.
FROM node:18-alpine
WORKDIR /usr/src/app

# Copiamos las dependencias de producción
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Copiamos la aplicación construida (la carpeta 'dist')
COPY --from=builder /usr/src/app/dist ./dist

# Exponemos el puerto en el que corre nuestra app de NestJS (definido en main.ts)
EXPOSE 3001

# El comando para iniciar la aplicación en producción
CMD ["node", "dist/main"]