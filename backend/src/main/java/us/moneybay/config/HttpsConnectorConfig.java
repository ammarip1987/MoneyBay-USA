package us.moneybay.config;

import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;

/**
 * Второй порт — с шифрованием, рядом с обычным.
 *
 * Основной порт Spring отдаёт без шифрования: на нём стоит балансировщик,
 * который завершает HTTPS у себя. Cloudflare же идёт прямо в задачу и стучится
 * по HTTPS, поэтому нужен второй порт, умеющий его принять.
 *
 * Пока живы оба пути, работают и оба порта. Когда балансировщик уйдёт, этот
 * класс удаляется, а порт с шифрованием задаётся обычными настройками
 * server.ssl.* — они уже прописаны в application-production.properties.
 *
 * Включается только когда хранилище ключей собрано: без SSL_KEYSTORE_PATH
 * ничего не создаётся, и местный запуск не меняется.
 */
@Configuration
public class HttpsConnectorConfig {

    @Value("${app.https-connector.port:8443}")
    private int httpsPort;

    @Value("${SSL_KEYSTORE_PATH:}")
    private String keystorePath;

    @Value("${SSL_KEYSTORE_PASSWORD:}")
    private String keystorePassword;

    @Value("${SSL_KEY_ALIAS:origin}")
    private String keyAlias;

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> httpsConnector() {
        return factory -> {
            if (keystorePath == null || keystorePath.isBlank()) {
                return;
            }
            File keystore = new File(keystorePath);
            if (!keystore.isFile()) {
                return;
            }

            Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
            connector.setPort(httpsPort);
            connector.setScheme("https");
            connector.setSecure(true);
            connector.setProperty("SSLEnabled", "true");
            connector.setProperty("sslProtocol", "TLS");
            connector.setProperty("keystoreFile", keystore.getAbsolutePath());
            connector.setProperty("keystorePass", keystorePassword);
            connector.setProperty("keystoreType", "PKCS12");
            connector.setProperty("keyAlias", keyAlias);

            factory.addAdditionalTomcatConnectors(connector);
        };
    }
}
