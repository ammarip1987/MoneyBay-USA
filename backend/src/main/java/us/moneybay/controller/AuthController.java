package us.moneybay.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import us.moneybay.dto.AuthDto;
import us.moneybay.dto.UserDto;
import us.moneybay.model.User;
import us.moneybay.repository.EmailVerificationTokenRepository;
import us.moneybay.repository.UserRepository;
import us.moneybay.security.JwtUtil;
import us.moneybay.service.EmailVerificationService;
import us.moneybay.service.RecaptchaService;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    /** Имя куки с обновляющим токеном. */
    private static final String REFRESH_COOKIE = "mb_refresh";

    @Value("${app.jwt.refresh-expiration}")
    private long refreshExpiration;

    /**
     * Область куки. На production — .moneybay.us, чтобы её слал и сайт, и API;
     * при локальном запуске пусто, иначе браузер куку с чужой областью отбросит.
     */
    @Value("${app.cookie.domain:}")
    private String cookieDomain;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RecaptchaService recaptchaService;
    private final EmailVerificationService emailVerificationService;
    private final EmailVerificationTokenRepository tokenRepository;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          RecaptchaService recaptchaService,
                          EmailVerificationService emailVerificationService,
                          EmailVerificationTokenRepository tokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.recaptchaService = recaptchaService;
        this.emailVerificationService = emailVerificationService;
        this.tokenRepository = tokenRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthDto.RegisterRequest req, HttpServletRequest request) {
        String clientIp = resolveClientIp(request);
        if (!recaptchaService.verify(req.getRecaptcha_token(), clientIp)) {
            return ResponseEntity.status(403).body(Map.of(
                "code", "RECAPTCHA_FAILED",
                "message", "reCAPTCHA verification failed. Please try again."
            ));
        }

        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of(
                "code", "EMAIL_TAKEN",
                "message", "Email already registered"
            ));
        }
        if (userRepository.existsByUsername(req.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of(
                "code", "USERNAME_TAKEN",
                "message", "Username already taken"
            ));
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setCity(req.getCity());
        user.setEmailVerified(false);
        user = userRepository.save(user);

        try {
            emailVerificationService.issueVerificationToken(user);
        } catch (Exception e) {
            log.error("[AuthController] Failed to issue verification token for {}: {}", user.getEmail(), e.getMessage());
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(new AuthDto.AuthResponse(token, UserDto.from(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDto.LoginRequest req, HttpServletRequest request) {
        String clientIp = resolveClientIp(request);
        if (!recaptchaService.verify(req.getRecaptcha_token(), clientIp)) {
            return ResponseEntity.status(403).body(Map.of(
                "code", "RECAPTCHA_FAILED",
                "message", "reCAPTCHA verification failed. Please try again."
            ));
        }

        return userRepository.findByEmail(req.getEmail())
            .filter(u -> passwordEncoder.matches(req.getPassword(), u.getPassword()))
            .map(user -> {
                String token = jwtUtil.generateToken(user.getId(), user.getEmail());
                return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie(
                        jwtUtil.generateRefreshToken(user.getId(), user.getEmail())).toString())
                    .body((Object) new AuthDto.AuthResponse(token, UserDto.from(user)));
            })
            .orElse(ResponseEntity.status(401).body(Map.of(
                "code", "INVALID_CREDENTIALS",
                "message", "Invalid email or password"
            )));
    }

    /**
     * Кука с обновляющим токеном.
     *
     * httpOnly закрывает её от скриптов на странице — в этом весь смысл: токен
     * доступа живёт в памяти вкладки и пропадает при перезагрузке, а продлить
     * вход можно только этой кукой, до которой чужой скрипт не дотянется.
     *
     * sameSite=None нужен потому, что сайт и API на разных именах
     * (moneybay.us и api.moneybay.us) — при Strict браузер куку бы не отправил.
     * Защиту от подделки запросов держит проверка вида токена: обновляющий к
     * защищённым адресам не подходит, а обновление отдаёт токен только тому,
     * кто уже вошёл.
     */
    private ResponseCookie refreshCookie(String token) {
        return buildRefreshCookie(token, Duration.ofMillis(refreshExpiration));
    }

    /** Та же кука с нулевым сроком: браузер её удаляет. */
    private ResponseCookie clearedRefreshCookie() {
        return buildRefreshCookie("", Duration.ZERO);
    }

    private ResponseCookie buildRefreshCookie(String token, Duration maxAge) {
        ResponseCookie.ResponseCookieBuilder cookie = ResponseCookie.from(REFRESH_COOKIE, token)
            .httpOnly(true)
            .secure(true)
            .sameSite("None")
            .path("/api/auth")
            .maxAge(maxAge);
        // Область задаётся только когда она указана: пустая строка сделала бы
        // куку недействительной, и при локальном запуске вход бы не держался
        if (cookieDomain != null && !cookieDomain.isBlank()) {
            cookie.domain(cookieDomain);
        }
        return cookie.build();
    }

    /**
     * Новый токен доступа по куке.
     *
     * Вызывается, когда прежний истёк — фронт делает это сам и повторяет
     * запрос, так что для вошедшего ничего не меняется.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {

        if (refreshToken == null || refreshToken.isBlank()
                || !jwtUtil.isValid(refreshToken)
                || !jwtUtil.isRefreshToken(refreshToken)) {
            return ResponseEntity.status(401)
                .header(HttpHeaders.SET_COOKIE, clearedRefreshCookie().toString())
                .body(Map.of("code", "REFRESH_INVALID", "message", "Session expired"));
        }

        Long userId = jwtUtil.parseUserId(refreshToken);
        return userRepository.findById(userId)
            .map(user -> {
                String token = jwtUtil.generateToken(user.getId(), user.getEmail());
                // Кука выдаётся заново: иначе вход обрывался бы ровно через срок
                // обновляющего токена, сколько бы человек ни пользовался сайтом
                return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie(
                        jwtUtil.generateRefreshToken(user.getId(), user.getEmail())).toString())
                    .body((Object) new AuthDto.AuthResponse(token, UserDto.from(user)));
            })
            .orElse(ResponseEntity.status(401)
                .header(HttpHeaders.SET_COOKIE, clearedRefreshCookie().toString())
                .body(Map.of("code", "USER_GONE", "message", "Session expired")));
    }

    /** Выход: кука удаляется, продлить вход больше нечем. */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clearedRefreshCookie().toString())
            .body(Map.of("success", true));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody AuthDto.VerifyEmailRequest req) {
        var tokenOpt = tokenRepository.findByToken(req.getToken());
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of(
                "code", "TOKEN_INVALID",
                "message", "Invalid verification token"
            ));
        }
        var token = tokenOpt.get();
        if (token.getUsedAt() != null) {
            return ResponseEntity.status(400).body(Map.of(
                "code", "TOKEN_USED",
                "message", "This verification link was already used"
            ));
        }
        if (token.getExpiresAt() != null && token.getExpiresAt().isBefore(java.time.Instant.now())) {
            return ResponseEntity.status(400).body(Map.of(
                "code", "TOKEN_EXPIRED",
                "message", "Verification link expired. Request a new one."
            ));
        }

        boolean ok = emailVerificationService.verifyEmail(req.getToken());
        if (!ok) {
            return ResponseEntity.status(400).body(Map.of(
                "code", "TOKEN_INVALID",
                "message", "Could not verify email"
            ));
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Email verified successfully"));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@Valid @RequestBody AuthDto.ResendVerificationRequest req) {
        var tokenOpt = tokenRepository.findByToken(req.getToken());
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of(
                "code", "TOKEN_INVALID",
                "message", "Invalid token reference"
            ));
        }
        User user = tokenOpt.get().getUser();
        if (user.isEmailVerified()) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Email already verified"));
        }
        try {
            emailVerificationService.issueVerificationToken(user);
        } catch (Exception e) {
            log.error("[AuthController] Resend verification failed: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "code", "EMAIL_SEND_FAILED",
                "message", "Could not send verification email. Please contact support."
            ));
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Verification email sent"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            try {
                emailVerificationService.issuePasswordResetToken(userOpt.get());
            } catch (Exception e) {
                log.error("[AuthController] Password reset email failed: {}", e.getMessage());
            }
        }
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "If an account exists with that email, a password reset link has been sent."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("password");
        if (token == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of(
                "code", "INVALID_INPUT",
                "message", "Token and password (min 6 chars) required"
            ));
        }
        Optional<User> userOpt = emailVerificationService.consumePasswordResetToken(token);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of(
                "code", "TOKEN_INVALID",
                "message", "Invalid or expired password reset token"
            ));
        }
        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Password reset successfully"));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp;
        return request.getRemoteAddr();
    }
}
