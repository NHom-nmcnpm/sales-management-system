FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
RUN npm ci
COPY . .
RUN npm run build

FROM build AS runtime
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["npm", "start", "-w", "backend"]
