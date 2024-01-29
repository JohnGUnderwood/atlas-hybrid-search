FROM node:20
WORKDIR /usr/src/app
COPY ./ ./
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]