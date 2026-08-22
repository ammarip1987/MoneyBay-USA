package us.moneybay.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration}")
    private long expiration;

    @Value("${app.jwt.refresh-expiration}")
    private long refreshExpiration;

    /** Пометка вида токена: обновляющий к защищённым адресам не подходит. */
    private static final String CLAIM_TYPE = "typ";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Токен доступа: живёт минуты и держится только в памяти вкладки. Короткий
     * срок здесь и есть защита — украденный чужим скриптом токен устаревает
     * прежде, чем им успеют воспользоваться.
     */
    public String generateToken(Long userId, String email) {
        return Jwts.builder()
            .subject(String.valueOf(userId))
            .claim("email", email)
            .claim(CLAIM_TYPE, TYPE_ACCESS)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getKey())
            .compact();
    }

    /**
     * Обновляющий токен: уходит в куку HttpOnly, поэтому скриптам на странице
     * недоступен. Им нельзя обратиться к защищённым адресам — только получить
     * новый токен доступа.
     */
    public String generateRefreshToken(Long userId, String email) {
        return Jwts.builder()
            .subject(String.valueOf(userId))
            .claim("email", email)
            .claim(CLAIM_TYPE, TYPE_REFRESH)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
            .signWith(getKey())
            .compact();
    }

    /** Обновляющий ли это токен. Отделяет один вид от другого. */
    public boolean isRefreshToken(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(getKey()).build()
                .parseSignedClaims(token).getPayload();
            return TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Годен ли токен для защищённых адресов. Обновляющий здесь отвергается: он
     * живёт неделями, и допусти его фильтр — длинный срок обесценил бы короткий
     * срок токена доступа.
     */
    public boolean isAccessToken(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(getKey()).build()
                .parseSignedClaims(token).getPayload();
            String type = claims.get(CLAIM_TYPE, String.class);
            // Токены, выданные до разделения, пометки не несут — они считаются
            // токенами доступа, иначе вход слетел бы у всех разом
            return type == null || TYPE_ACCESS.equals(type);
        } catch (Exception e) {
            return false;
        }
    }

    public String parseEmail(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(getKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return claims.get("email", String.class);
    }

    public Long parseUserId(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(getKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
        return Long.parseLong(claims.getSubject());
    }

    public boolean isValid(String token) {
        try {
            Jwts.parser().verifyWith(getKey()).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
