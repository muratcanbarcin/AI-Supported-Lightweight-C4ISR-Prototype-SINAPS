# C4ISR Backend (Java Spring Boot)

This is the Java Spring Boot backend service for the C4ISR system.

## Features

- **MQTT Listener** - Subscribes to telemetry topics from simulators
- **AI Service Integration** - Forwards telemetry to AI microservice for analysis
- **Database Persistence** - Stores telemetry and analysis results in PostgreSQL
- **REST API** - Exposes endpoints for frontend consumption

## Technology Stack

- Java 17+
- Spring Boot 3.x
- Spring Data JPA
- WebFlux (for AI service client)
- MQTT (Paho client)
- PostgreSQL

## Running

### Prerequisites

1. PostgreSQL running (see `../postgres/` for Docker setup)
2. MQTT broker running (see `../mosquitto/` for Docker setup)
3. AI service running at `http://localhost:8000`

### Build & Run

```bash
cd backend
./mvnw spring-boot:run
```

Or use Docker Compose from project root:

```bash
docker-compose up backend
```

## Project Structure

```
backend/
├── src/main/java/com/sinaps/c4isr_backend/
│   ├── C4isrBackendApplication.java    # Entry point
│   ├── client/                          # External service clients
│   ├── config/                          # Configuration classes
│   ├── controller/                      # REST controllers
│   ├── dto/                             # Data Transfer Objects
│   ├── model/                           # JPA entities
│   ├── repository/                      # Data access layer
│   └── service/                         # Business logic
└── pom.xml                              # Maven dependencies
```
