package us.moneybay.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Разделение токенов доступа и обновления.
 *
 * Токен доступа живёт минуты и держится в памяти вкладки, обновляющий — недели
 * и уходит в куку HttpOnly. Всё это имеет смысл, только пока одно нельзя выдать
 * за другое: пройди обновляющий токен в защищённые адреса, его длинный срок
 * свёл бы короткий срок первого к нулю.
 */
class JwtUtilTest {

    private JwtUtil jwt;

    @BeforeEach
    void setUp() {
        jwt = new JwtUtil();
        ReflectionTestUtils.setField(jwt, "secret",
            "test-secret-key-long-enough-for-hmac-sha256-signing-abcdef");
        ReflectionTestUtils.setField(jwt, "expiration", 900_000L);
        ReflectionTestUtils.setField(jwt, "refreshExpiration", 2_592_000_000L);
    }

    @Test
    @DisplayName("токен доступа годен для защищённых адресов")
    void accessTokenPassesTheFilter() {
        String token = jwt.generateToken(42L, "buyer@example.com");

        assertTrue(jwt.isValid(token));
        assertTrue(jwt.isAccessToken(token));
        assertFalse(jwt.isRefreshToken(token));
        assertEquals(42L, jwt.parseUserId(token));
    }

    @Test
    @DisplayName("обновляющий токен к защищённым адресам не подходит")
    void refreshTokenIsRejectedByTheFilter() {
        String token = jwt.generateRefreshToken(42L, "buyer@example.com");

        assertTrue(jwt.isValid(token), "подпись верна — токен наш");
        assertTrue(jwt.isRefreshToken(token));
        // Здесь и держится вся защита: неделями живущий токен не должен
        // открывать доступ к личным данным
        assertFalse(jwt.isAccessToken(token),
            "обновляющий токен не должен приниматься фильтром");
    }

    @Test
    @DisplayName("токен без пометки считается токеном доступа")
    void tokenWithoutTypeIsTreatedAsAccess() {
        // Токены, выданные до разделения, пометки не несут. Отвергни их фильтр —
        // у всех вошедших вход слетел бы разом при выкладке
        String legacy = io.jsonwebtoken.Jwts.builder()
            .subject("42")
            .claim("email", "buyer@example.com")
            .issuedAt(new java.util.Date())
            .expiration(new java.util.Date(System.currentTimeMillis() + 900_000L))
            .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                "test-secret-key-long-enough-for-hmac-sha256-signing-abcdef"
                    .getBytes(java.nio.charset.StandardCharsets.UTF_8)))
            .compact();

        assertTrue(jwt.isAccessToken(legacy));
        assertFalse(jwt.isRefreshToken(legacy));
    }

    @Test
    @DisplayName("подделанный токен не проходит ни одну проверку")
    void forgedTokenFailsEverything() {
        // Подпись заменена целиком: приписывание знака в конец иногда не меняет
        // расшифровку base64, и токен остаётся годным
        String[] parts = jwt.generateToken(42L, "buyer@example.com").split("\\.");
        String forged = parts[0] + "." + parts[1] + ".YWFhYWFhYWFhYWFhYWFhYWFhYWE";

        assertFalse(jwt.isValid(forged));
        assertFalse(jwt.isAccessToken(forged));
        assertFalse(jwt.isRefreshToken(forged));
    }

    @Test
    @DisplayName("истёкший токен доступа отвергается")
    void expiredAccessTokenIsRejected() {
        ReflectionTestUtils.setField(jwt, "expiration", -1_000L);
        String expired = jwt.generateToken(42L, "buyer@example.com");

        assertFalse(jwt.isValid(expired));
        assertFalse(jwt.isAccessToken(expired));
    }

    @Test
    @DisplayName("оба токена несут номер и почту владельца")
    void bothTokensCarryTheOwner() {
        String access = jwt.generateToken(7L, "seller@example.com");
        String refresh = jwt.generateRefreshToken(7L, "seller@example.com");

        assertEquals(7L, jwt.parseUserId(access));
        assertEquals(7L, jwt.parseUserId(refresh));
        assertEquals("seller@example.com", jwt.parseEmail(access));
        assertEquals("seller@example.com", jwt.parseEmail(refresh));
    }
}
