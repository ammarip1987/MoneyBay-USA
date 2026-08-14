package us.moneybay.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import us.moneybay.config.OAuth2Properties;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Apple не отдаёт userinfo-эндпоинт: данные пользователя лежат в id_token.
 * Подпись id_token проверяется по публичным ключам Apple (RS256),
 * а client_secret для обмена кода — это JWT, подписанный ES256 ключом из .p8.
 */
@Service
@RequiredArgsConstructor
public class AppleAuthService {

    private static final Logger log = LoggerFactory.getLogger(AppleAuthService.class);
    private static final String ISSUER = "https://appleid.apple.com";
    private static final String KEYS_URL = ISSUER + "/auth/keys";

    private final OAuth2Properties props;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, RSAPublicKey> keyCache = new ConcurrentHashMap<>();

    /**
     * client_secret для Apple — короткоживущий JWT (ES256), подписанный приватным ключом.
     * Apple ограничивает срок шестью месяцами; берём 5 минут, секрет нужен только на обмен.
     */
    public String buildClientSecret() throws Exception {
        Instant now = Instant.now();
        return Jwts.builder()
            .header().keyId(props.getAppleKeyId()).and()
            .issuer(props.getAppleTeamId())
            .subject(props.getAppleClientId())
            .audience().add(ISSUER).and()
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(5, ChronoUnit.MINUTES)))
            .signWith(loadPrivateKey(), Jwts.SIG.ES256)
            .compact();
    }

    /** Проверяет подпись и claims id_token, возвращает payload. */
    public Claims verifyIdToken(String idToken) {
        String kid = extractKid(idToken);
        if (kid == null) return null;

        RSAPublicKey key = resolveKey(kid);
        if (key == null) return null;

        try {
            return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(ISSUER)
                .requireAudience(props.getAppleClientId())
                .build()
                .parseSignedClaims(idToken)
                .getPayload();
        } catch (Exception e) {
            log.warn("Apple id_token rejected: {}", e.getMessage());
            return null;
        }
    }

    private PrivateKey loadPrivateKey() throws Exception {
        String pem = props.getApplePrivateKey()
            .replace("\\n", "\n")
            .replaceAll("-----BEGIN [A-Z ]+-----", "")
            .replaceAll("-----END [A-Z ]+-----", "")
            .replaceAll("\\s", "");
        byte[] der = Base64.getDecoder().decode(pem);
        return KeyFactory.getInstance("EC").generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    private String extractKid(String idToken) {
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) return null;
            byte[] header = Base64.getUrlDecoder().decode(parts[0]);
            JsonNode node = objectMapper.readTree(new String(header, StandardCharsets.UTF_8));
            return node.path("kid").asText(null);
        } catch (Exception e) {
            return null;
        }
    }

    /** Ключи Apple ротуются: кэш обновляется, когда приходит незнакомый kid. */
    private RSAPublicKey resolveKey(String kid) {
        RSAPublicKey cached = keyCache.get(kid);
        if (cached != null) return cached;
        refreshKeys();
        return keyCache.get(kid);
    }

    private void refreshKeys() {
        try {
            String body = restTemplate.getForObject(KEYS_URL, String.class);
            if (body == null) return;
            JsonNode keys = objectMapper.readTree(body).path("keys");
            for (JsonNode jwk : keys) {
                if (!"RSA".equals(jwk.path("kty").asText())) continue;
                String kid = jwk.path("kid").asText(null);
                if (kid == null) continue;
                BigInteger modulus = new BigInteger(1, Base64.getUrlDecoder().decode(jwk.path("n").asText()));
                BigInteger exponent = new BigInteger(1, Base64.getUrlDecoder().decode(jwk.path("e").asText()));
                RSAPublicKey key = (RSAPublicKey) KeyFactory.getInstance("RSA")
                    .generatePublic(new RSAPublicKeySpec(modulus, exponent));
                keyCache.put(kid, key);
            }
        } catch (Exception e) {
            log.warn("Failed to refresh Apple signing keys: {}", e.getMessage());
        }
    }
}
