# Multi-stage build for Spring Boot
FROM eclipse-temurin:25-jdk-alpine AS builder

RUN apk add --no-cache bash

WORKDIR /app

# Copy Maven wrapper and pom first for better layer caching
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Make mvnw executable and download dependencies
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Build with more memory
RUN ./mvnw package -DskipTests -B -Dmaven.test.skip=true || ./mvnw package -DskipTests -B

FROM eclipse-temurin:25-jre-alpine

RUN apk add --no-cache curl

WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=production

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
