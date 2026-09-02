package us.moneybay.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import us.moneybay.config.OAuth2Properties;
import us.moneybay.dto.AuthDto;
import us.moneybay.dto.UserDto;
import us.moneybay.model.User;
import us.moneybay.security.JwtUtil;
import us.moneybay.service.OAuth2Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/oauth2")
@RequiredArgsConstructor
public class OAuth2Controller {
    @Value("${app.cookie.domain:}")
    private String cookieDomain;

    @Value("${app.jwt.refresh-expiration:2592000000}")
    private long refreshExpiration;

    private final OAuth2Service oauth2Service;
    private final OAuth2Properties props;
    private final JwtUtil jwtUtil;

    /**
     * Client ID публичны по своей природе и отдаются клиенту отсюда.
     * Так новые credentials задаются переменными окружения, без пересборки frontend.
     */
    @GetMapping("/config")
    public ResponseEntity<?> config() {
        List<Map<String, String>> providers = new ArrayList<>();
        for (String provider : List.of("google", "facebook", "apple")) {
            if (!props.isEnabled(provider)) continue;
            Map<String, String> entry = new LinkedHashMap<>();
            entry.put("provider", provider);
            entry.put("clientId", props.clientIdOf(provider));
            providers.add(entry);
        }
        return ResponseEntity.ok(Map.of("providers", providers));
    }

    /**
     * Принимает authorization code (основной путь) либо готовый токен от клиентского SDK.
     * Секреты провайдеров остаются на backend.
     */
    @PostMapping("/{provider}")
    public ResponseEntity<?> login(@PathVariable String provider,
                                   @RequestBody Map<String, String> body) {
        if (!OAuth2Service.isSupported(provider)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Unsupported provider"));
        }
        if (!props.isEnabled(provider)) {
            return ResponseEntity.status(503).body(Map.of(
                "message", "Sign-in with " + provider + " is not configured"));
        }

        String code = trimToNull(body.get("code"));
        String accessToken = trimToNull(body.get("access_token"));
        String idToken = trimToNull(body.get("id_token"));

        User user;
        if (code != null) {
            String redirectUri = trimToNull(body.get("redirect_uri"));
            if (redirectUri == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Missing redirect_uri"));
            }
            user = oauth2Service.loginWithCode(provider, code, redirectUri);
        } else if (idToken != null || accessToken != null) {
            user = oauth2Service.loginWithAccessToken(provider, idToken != null ? idToken : accessToken);
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing authorization code"));
        }

        if (user == null) {
            return ResponseEntity.status(401).body(Map.of(
                "message", "Failed to authenticate with " + provider));
        }

        String jwt = jwtUtil.generateToken(user.getId(), user.getEmail());

        // Обновляющая cookie, та же, что при входе почтой. Прежде вход через
        // службу отдавал только токен доступа: он живёт минуты, обновить его
        // было нечем, и после перезагрузки страницы человек оказывался снаружи
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());
        ResponseCookie refresh = buildRefreshCookie(refreshToken);

        // Токен идёт и в теле: куку стирает чистка данных сайта, а копия в
        // хранилище её переживает и продлевает вход заголовком
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refresh.toString())
            .body(new AuthDto.AuthResponse(jwt, UserDto.from(user), refreshToken));
    }

    /**
     * Cookie с обновляющим токеном. Повторяет настройку из AuthController:
     * защищённость и SameSite=None нужны, когда сайт и API на разных именах,
     * а при местном запуске соединение обычное и такая cookie отбрасывается.
     */
    private ResponseCookie buildRefreshCookie(String token) {
        boolean remote = cookieDomain != null && !cookieDomain.isBlank();

        ResponseCookie.ResponseCookieBuilder cookie = ResponseCookie.from("mb_refresh", token)
            .httpOnly(true)
            .secure(remote)
            .sameSite(remote ? "None" : "Lax")
            .path("/api/auth")
            .maxAge(Duration.ofMillis(refreshExpiration));
        if (remote) {
            cookie.domain(cookieDomain);
        }
        return cookie.build();
    }

    private static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
