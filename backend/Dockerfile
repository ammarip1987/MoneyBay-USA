# Multi-stage build for Spring Boot
FROM eclipse-temurin:21-jdk AS builder

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

FROM eclipse-temurin:21-jre

WORKDIR /app
RUN groupadd -r spring && useradd -r -g spring spring
USER spring

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=production

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
