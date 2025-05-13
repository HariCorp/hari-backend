# Dockerfile for Upload Service
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm install
RUN npm install -g typescript ts-node

# Expose port (if needed)
# EXPOSE 3006

# Command to run app
CMD ["npm", "run", "start:dev", "upload-service"]