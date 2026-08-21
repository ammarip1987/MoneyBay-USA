package us.moneybay.service;

import com.fasterxml.jackson.databind.JsonNode;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import us.moneybay.config.OAuth2Properties;
import us.moneybay.model.SocialAccount;
import us.moneybay.model.User;
import us.moneybay.repository.SocialAccountRepository;
import us.moneybay.repository.UserRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OAuth2Service {

    private static final Logger log = LoggerFactory.getLogger(OAuth2Service.class);
    private static final Set<String> SUPPORTED = Set.of("google", "facebook", "apple");

    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
    private static final String FACEBOOK_TOKEN_URL = "https://graph.facebook.com/v18.0/oauth/access_token";
    private static final String FACEBOOK_USERINFO_URL = "https://graph.facebook.com/v18.0/me";
    private static final String APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";

    private final SocialAccountRepository socialAccountRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppleAuthService appleAuthService;
    private final OAuth2Properties props;
    // Бина RestTemplate в контексте нет (как в RecaptchaService) — создаём здесь
    private final RestTemplate restTemplate = new RestTemplate();

    public static boolean isSupported(String provider) {
        return provider != null && SUPPORTED.contains(provider.toLowerCase());
    }

    /** Профиль, приведённый к общему виду независимо от провайдера. */
    private record Profile(String providerId, String email, String name, String picture) {}

    /**
     * Authorization code flow: код обменивается на токен на стороне backend,
     * client secret в браузер не попадает.
     */
    @Transactional
    public User loginWithCode(String provider, String code, String redirectUri) {
        Profile profile = switch (provider.toLowerCase()) {
            case "google" -> googleByCode(code, redirectUri);
            case "facebook" -> facebookByCode(code, redirectUri);
            case "apple" -> appleByCode(code, redirectUri);
            default -> null;
        };
        return profile == null ? null : linkOrCreate(provider.toLowerCase(), profile);
    }

    /** Implicit flow для клиентских SDK, которые сами получают access_token. */
    @Transactional
    public User loginWithAccessToken(String provider, String accessToken) {
        Profile profile = switch (provider.toLowerCase()) {
            case "google" -> googleProfile(accessToken);
            case "facebook" -> facebookProfile(accessToken);
            case "apple" -> appleProfile(accessToken);
            default -> null;
        };
        return profile == null ? null : linkOrCreate(provider.toLowerCase(), profile);
    }

    // --- Google ---

    private Profile googleByCode(String code, String redirectUri) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", props.getGoogleClientId());
        form.add("client_secret", props.getGoogleClientSecret());
        form.add("redirect_uri", redirectUri);
        form.add("grant_type", "authorization_code");

        JsonNode token = postForm(GOOGLE_TOKEN_URL, form);
        if (token == null) return null;
        String accessToken = token.path("access_token").asText(null);
        return accessToken == null ? null : googleProfile(accessToken);
    }

    private Profile googleProfile(String accessToken) {
        JsonNode me = getJson(GOOGLE_USERINFO_URL + "?access_token=" + accessToken);
        if (me == null || me.path("id").isMissingNode()) return null;
        return new Profile(
            me.path("id").asText(),
            emptyToNull(me.path("email").asText(null)),
            emptyToNull(me.path("name").asText(null)),
            emptyToNull(me.path("picture").asText(null)));
    }

    // --- Facebook ---

    private Profile facebookByCode(String code, String redirectUri) {
        String url = FACEBOOK_TOKEN_URL
            + "?client_id=" + props.getFacebookAppId()
            + "&client_secret=" + props.getFacebookAppSecret()
            + "&redirect_uri=" + redirectUri
            + "&code=" + code;
        JsonNode token = getJson(url);
        if (token == null) return null;
        String accessToken = token.path("access_token").asText(null);
        return accessToken == null ? null : facebookProfile(accessToken);
    }

    private Profile facebookProfile(String accessToken) {
        JsonNode me = getJson(FACEBOOK_USERINFO_URL
            + "?fields=id,email,name,picture.type(large)&access_token=" + accessToken);
        if (me == null || me.path("id").isMissingNode()) return null;
        return new Profile(
            me.path("id").asText(),
            emptyToNull(me.path("email").asText(null)),
            emptyToNull(me.path("name").asText(null)),
            emptyToNull(me.path("picture").path("data").path("url").asText(null)));
    }

    // --- Apple ---

    private Profile appleByCode(String code, String redirectUri) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("code", code);
            form.add("client_id", props.getAppleClientId());
            form.add("client_secret", appleAuthService.buildClientSecret());
            form.add("redirect_uri", redirectUri);
            form.add("grant_type", "authorization_code");

            JsonNode token = postForm(APPLE_TOKEN_URL, form);
            if (token == null) return null;
            String idToken = token.path("id_token").asText(null);
            return idToken == null ? null : appleProfile(idToken);
        } catch (Exception e) {
            log.warn("Apple code exchange failed: {}", e.getMessage());
            return null;
        }
    }

    /** У Apple профиль берётся из подписанного id_token, отдельного userinfo нет. */
    private Profile appleProfile(String idToken) {
        Claims claims = appleAuthService.verifyIdToken(idToken);
        if (claims == null || claims.getSubject() == null) return null;
        Object email = claims.get("email");
        return new Profile(
            claims.getSubject(),
            email == null ? null : String.valueOf(email),
            null,
            null);
    }

    // --- Привязка и создание пользователя ---

    private User linkOrCreate(String provider, Profile profile) {
        Optional<SocialAccount> existing =
            socialAccountRepository.findByProviderAndProviderId(provider, profile.providerId());
        if (existing.isPresent()) {
            // SocialAccount.user загружается лениво: вернуть прокси нельзя — транзакция
            // закрывается на выходе отсюда, и контроллер получит LazyInitializationException
            return userRepository.findById(existing.get().getUser().getId()).orElse(null);
        }

        // Тот же email, зашедший ранее паролем или другой соцсетью — привязка к тому же аккаунту
        User user = profile.email() == null
            ? createUser(placeholderEmail(provider, profile.providerId()), profile.name())
            : userRepository.findByEmail(profile.email())
                .orElseGet(() -> createUser(profile.email(), profile.name()));

        // Фотография из Google или Facebook становится аватаром, если своей нет.
        // Уже загруженную не трогаем: выбор пользователя важнее.
        if (profile.picture() != null && user.getAvatarUrl() == null) {
            user.setAvatarUrl(profile.picture());
            user = userRepository.save(user);
        }

        SocialAccount account = new SocialAccount();
        account.setUser(user);
        account.setProvider(provider);
        account.setProviderId(profile.providerId());
        account.setEmail(profile.email());
        account.setName(profile.name());
        account.setPicture(profile.picture());
        socialAccountRepository.save(account);
        return user;
    }

    private User createUser(String email, String name) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(uniqueUsername(name, email));
        // Пароля у OAuth-аккаунта нет; случайный хэш закрывает вход по паролю
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(Instant.now());
        user.setAdmin(false);
        return userRepository.save(user);
    }

    /** username в базе unique — к занятому имени добавляется суффикс. */
    private String uniqueUsername(String name, String email) {
        String base = (name != null ? name : email.split("@")[0])
            .toLowerCase()
            .replaceAll("[^a-z0-9]+", "");
        if (base.length() < 3) base = "user" + base;
        if (base.length() > 24) base = base.substring(0, 24);

        String candidate = base;
        for (int i = 0; i < 5 && userRepository.existsByUsername(candidate); i++) {
            candidate = base + UUID.randomUUID().toString().substring(0, 6);
        }
        return candidate;
    }

    /**
     * Apple Private Relay может не отдать email. Заглушка детерминирована
     * по провайдеру и его id, чтобы повторный вход не создавал второй аккаунт.
     */
    private String placeholderEmail(String provider, String providerId) {
        return provider + "_" + providerId + "@users.noreply.moneybay.us";
    }

    // --- HTTP ---

    private JsonNode postForm(String url, MultiValueMap<String, String> form) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            return restTemplate.postForObject(url, new HttpEntity<>(form, headers), JsonNode.class);
        } catch (Exception e) {
            log.warn("Token exchange failed at {}: {}", url, e.getMessage());
            return null;
        }
    }

    private JsonNode getJson(String url) {
        try {
            return restTemplate.getForObject(url, JsonNode.class);
        } catch (Exception e) {
            log.warn("Userinfo request failed: {}", e.getMessage());
            return null;
        }
    }

    private static String emptyToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
