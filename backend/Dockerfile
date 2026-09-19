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

# Тесты идут здесь, до упаковки: неудача останавливает сборку, и негодный образ
# до ECS не доезжает. Профиль test поднимает H2, к рабочей базе обращений нет.
# Занимают около полуминуты из трёх с половиной, что идёт вся сборка.
RUN ./mvnw package -B -Dspring.profiles.active=test

# headless: без графических библиотек и компилятора, только среда выполнения
FROM amazoncorretto:25-al2023-headless

# curl нужен проверке состояния контейнера, openssl — сборке хранилища ключей
RUN dnf install -y curl-minimal shadow-utils openssl && dnf clean all

WORKDIR /app
RUN groupadd -r spring && useradd -r -g spring spring

COPY --from=builder /app/target/*.jar app.jar

# Хранилище ключей собирается при запуске, а не кладётся в образ: сертификат
# приходит из Secrets Manager переменными среды, и в слоях образа ему не место
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && chown -R spring:spring /app

USER spring

EXPOSE 8080 8443
ENV SPRING_PROFILES_ACTIVE=production

ENTRYPOINT ["/app/entrypoint.sh"]
