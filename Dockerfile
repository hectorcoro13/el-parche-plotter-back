# ---- Base Stage ----
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# ---- Dependencies Stage ----
FROM base AS dependencies
RUN npm install --only=production
COPY . .

# ---- Build Stage ----
FROM base AS build
RUN npm install
COPY . .
# Asegúrate de que tu comando de build esté correcto en package.json
RUN npm run build

# ---- Production Stage ----
FROM base AS production
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# El puerto que tu app NestJS escucha internamente
EXPOSE 3001

# Comando para iniciar la aplicación
CMD ["node", "dist/main"]