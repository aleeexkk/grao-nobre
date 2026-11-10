# Imagem do front-end. Primeiro o Vite gera os arquivos estáticos, depois o nginx serve eles.

# ---- Etapa 1: gerar o site ----
FROM node:22-alpine AS compilar
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Endereço da API que o NAVEGADOR vai usar (é gravado dentro do site na hora do build)
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Etapa 2: servir com nginx ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilar /app/dist /usr/share/nginx/html
EXPOSE 80
