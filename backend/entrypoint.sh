#!/bin/sh
# Запуск задачи: сначала хранилище ключей, потом само приложение.
#
# Сертификат Cloudflare Origin приходит двумя переменными из Secrets Manager.
# Java читает только PKCS12, поэтому пара «сертификат + ключ» складывается в
# хранилище здесь, при каждом запуске: в образе ему не место, а на диске он
# живёт ровно столько, сколько работает задача.
#
# Без переменных всё остаётся как было — приложение поднимается на обычном
# HTTP. Так работает местный запуск и любая среда без сертификата.
set -e

if [ -n "${SSL_CERT:-}" ] && [ -n "${SSL_KEY:-}" ]; then
  CERT_DIR=/tmp/ssl
  mkdir -p "$CERT_DIR"

  printf '%s' "$SSL_CERT" > "$CERT_DIR/origin.pem"
  printf '%s' "$SSL_KEY" > "$CERT_DIR/origin.key"

  # Пароль хранилища случаен при каждом запуске: наружу оно не уходит, и
  # запоминать его незачем
  KEYSTORE_PASS=$(head -c 24 /dev/urandom | base64 | tr -d '\n=/+')

  openssl pkcs12 -export \
    -in "$CERT_DIR/origin.pem" \
    -inkey "$CERT_DIR/origin.key" \
    -out "$CERT_DIR/keystore.p12" \
    -name origin \
    -passout "pass:$KEYSTORE_PASS"

  # Исходники больше не нужны: в хранилище уже всё, что требуется
  rm -f "$CERT_DIR/origin.pem" "$CERT_DIR/origin.key"

  # Путь к хранилищу — признак для HttpsConnectorConfig: увидит его, поднимет
  # второй порт с шифрованием. Основной порт остаётся без него, под балансировщик
  export SSL_KEYSTORE_PATH="$CERT_DIR/keystore.p12"
  export SSL_KEYSTORE_PASSWORD="$KEYSTORE_PASS"
  export SSL_KEY_ALIAS=origin

  echo "Хранилище собрано: второй порт поднимется с шифрованием"
else
  echo "Сертификата нет — работаем по обычному HTTP"
fi

exec java -jar /app/app.jar
