#20.11.0
FROM node:20.11.0-alpine as build-stage

ENV PORT 3000

WORKDIR /app

COPY package.json ./

RUN npm install && npm cache clean --force

copy . .

RUN npm run build

# Stage 2: Production
FROM node:20.11.0-alpine as production-stage

# Working directory 설정
WORKDIR /app

# Build stage에서 생성된 파일들을 복사
COPY --from=build-stage /app/public ./public
COPY --from=build-stage /app/.next/standalone ./
COPY --from=build-stage /app/next.config.mjs ./
COPY --from=build-stage /app/.next/static ./.next/static

EXPOSE 3000/tcp
EXPOSE 3000

# front-react-dev:20250313-005932
CMD ["node", "server.js"]