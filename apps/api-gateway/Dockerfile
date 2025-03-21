FROM node:18-alpine AS build

WORKDIR /usr/src/app

# Copy package.json files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy source code
COPY apps/api-gateway ./apps/api-gateway
COPY libs ./libs

# Install dependencies and build
RUN npm install
RUN npm run build api-gateway || true

FROM node:18-alpine

WORKDIR /usr/src/app

# Copy files without || true
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package*.json ./

# Copy source directly for development
COPY --from=build /usr/src/app/apps/api-gateway/src ./src
COPY --from=build /usr/src/app/libs ./libs

EXPOSE 3000

# Use ts-node for development
CMD ["npx", "ts-node", "src/main.ts"]
