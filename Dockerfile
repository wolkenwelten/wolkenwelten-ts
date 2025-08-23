FROM node:lts-alpine
WORKDIR /app
RUN apk --no-cache add curl

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build && npm prune --production
CMD [ "npm", "start" ]

EXPOSE 3030
VOLUME /app/data/

HEALTHCHECK --interval=5m --timeout=3s CMD curl -f http://localhost:3030/api/health-check || exit 1 