package us.moneybay.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Credentials провайдеров читаются из окружения, в коде их нет.
 * Пока переменная не задана, провайдер отключён и его кнопка не отдаётся клиенту.
 */
@Component
@Getter
public class OAuth2Properties {

    @Value("${app.oauth2.google.client-id:}")
    private String googleClientId;

    @Value("${app.oauth2.google.client-secret:}")
    private String googleClientSecret;

    @Value("${app.oauth2.facebook.app-id:}")
    private String facebookAppId;

    @Value("${app.oauth2.facebook.app-secret:}")
    private String facebookAppSecret;

    /** Services ID из Apple Developer (не Bundle ID). */
    @Value("${app.oauth2.apple.client-id:}")
    private String appleClientId;

    @Value("${app.oauth2.apple.team-id:}")
    private String appleTeamId;

    @Value("${app.oauth2.apple.key-id:}")
    private String appleKeyId;

    /** Содержимое .p8 файла (PKCS#8, EC P-256), переносы строк допустимы как \n. */
    @Value("${app.oauth2.apple.private-key:}")
    private String applePrivateKey;

    public boolean isGoogleEnabled() {
        return notBlank(googleClientId) && notBlank(googleClientSecret);
    }

    public boolean isFacebookEnabled() {
        return notBlank(facebookAppId) && notBlank(facebookAppSecret);
    }

    public boolean isAppleEnabled() {
        return notBlank(appleClientId) && notBlank(appleTeamId)
            && notBlank(appleKeyId) && notBlank(applePrivateKey);
    }

    public boolean isEnabled(String provider) {
        if (provider == null) return false;
        return switch (provider.toLowerCase()) {
            case "google" -> isGoogleEnabled();
            case "facebook" -> isFacebookEnabled();
            case "apple" -> isAppleEnabled();
            default -> false;
        };
    }

    public String clientIdOf(String provider) {
        if (provider == null) return null;
        return switch (provider.toLowerCase()) {
            case "google" -> googleClientId;
            case "facebook" -> facebookAppId;
            case "apple" -> appleClientId;
            default -> null;
        };
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
