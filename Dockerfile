FROM node:slim
ENV MONGO_URL=none
ENV WEB_PORT=3005
ENV LOGIN_SERVER_URL=none
WORKDIR  /app
COPY package*.json app.js ./
RUN npm install
EXPOSE 3010
CMD ["node", "app.js"]
