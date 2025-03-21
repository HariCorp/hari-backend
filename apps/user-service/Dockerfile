FROM node:18-alpine AS build

WORKDIR /usr/src/app

# Copy package.json files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy source code
COPY apps/user-service ./apps/user-service
COPY libs ./libs

# Install dependencies and build
RUN npm install
RUN npm run build user-service || true

FROM node:18-alpine

WORKDIR /usr/src/app

# Copy files without || true
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package*.json ./

# Copy source directly
COPY --from=build /usr/src/app/apps/user-service/src ./src
COPY --from=build /usr/src/app/libs ./libs

EXPOSE 3001

# Use ts-node for development
CMD ["npx", "ts-node", "src/main.ts"]
