FROM node:20-alpine

WORKDIR /app

# copy package.json
COPY package*.json ./

# install dependencies
RUN npm install

# copy source code
COPY . .

# build vite app
RUN npm run build

# install static server
RUN npm install -g serve

# expose port
EXPOSE 3000

# serve built files
CMD ["serve","-s","dist","-l","3000"]
