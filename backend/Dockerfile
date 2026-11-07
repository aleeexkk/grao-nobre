# Imagem do back-end (API). Feita em duas etapas: a primeira compila o TypeScript,
# a segunda leva só o necessário pra rodar (imagem final menor).

# ---- Etapa 1: compilar ----
FROM node:22-alpine AS compilar
WORKDIR /app
# Copia primeiro só os arquivos de dependências: assim o Docker reaproveita o "npm ci" se elas não mudaram
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ---- Etapa 2: imagem final ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=compilar /app/dist ./dist
# Roda sem ser administrador (mais seguro)
USER node
EXPOSE 3000
CMD ["node", "dist/servidor.js"]
