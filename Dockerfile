FROM node:lts-alpine
WORKDIR /app

COPY . .
RUN npm ci && npm run build && npm ci --production

CMD [ "npm", "start" ]

EXPOSE 3030
VOLUME /app/data/

HEALTHCHECK --interval=1m --timeout=5s CMD node -e "fetch('http://localhost:3030/')"