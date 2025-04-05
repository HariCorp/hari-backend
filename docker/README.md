# Docker Setup for Microservices

This directory contains Docker configurations for all microservices in the Hari Backend project.

## Structure

- `development/`: Contains the docker-compose.yml for local development
- Service directories: Each contains a Dockerfile for the specific service

## Services

The following services are containerized:

1. **API Gateway** (Port: 3000)
2. **Auth Service** (Port: 3001)
3. **User Service** (Port: 3002)
4. **Product Service** (Port: 3003)
5. **Payment Service** (Port: 3004)
6. **AI Service** (Port: 3005)

## Infrastructure Services

In addition to the application services, the following infrastructure services are also deployed:

1. **Kafka & Zookeeper**: Message broker for inter-service communication
2. **Kafdrop**: Web UI for Kafka monitoring (Port: 9000)
3. **MongoDB**: Database service (Port: 27017)
4. **Redis**: Caching service (Port: 6379)

## Network

All services are connected via a Docker network named `hari-network` to ensure they can communicate with each other.

## Usage

### Starting all services

```bash
npm run docker:up
```

### Stopping all services

```bash
npm run docker:down
```

### Viewing logs

```bash
npm run docker:logs
```

### Viewing logs for a specific service

```bash
docker logs -f <service-name>
```

## Development Workflow

For local development, the docker-compose setup mounts the source code directories as volumes, so changes to the code will be reflected in the running containers without needing to rebuild. 