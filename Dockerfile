FROM dogwalker_listing:14
WORKINGDIR /app
COPY package*.json app.js ./
RUN npm install
EXPOSE 3010
CMD ["node", "app.js"]