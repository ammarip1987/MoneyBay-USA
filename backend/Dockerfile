# Multi-stage build for Spring Boot
#
# Amazon Corretto: сборка OpenJDK от Amazon, та же среда, в которой задача и
# запускается (ECS Fargate). Основа — Amazon Linux 2023, поэтому dnf и
# groupadd/useradd вместо apk и adduser.
FROM amazoncorretto:25-al2023-jdk AS builder

# tar нужен обёртке Maven для распаковки дистрибутива; в этом образе его нет
RUN dnf install -y tar gzip && dnf clean all

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

# headless: без графических библиотек и компилятора, только среда выполнения
FROM amazoncorretto:25-al2023-headless

# curl нужен проверке состояния контейнера
RUN dnf install -y curl-minimal shadow-utils && dnf clean all

WORKDIR /app
RUN groupadd -r spring && useradd -r -g spring spring
USER spring

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=production

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
