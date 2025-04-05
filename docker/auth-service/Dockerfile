FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm install
RUN npm install -g typescript ts-node

# Copy source files
COPY . .

# Expose port
EXPOSE 3001

# Command to run app
CMD ["npm", "run", "start:dev", "auth-service"] 