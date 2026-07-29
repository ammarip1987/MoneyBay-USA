package us.moneybay.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class RecaptchaService {

    private static final Logger log = LoggerFactory.getLogger(RecaptchaService.class);
    private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    @Value("${app.recaptcha.secret-key:}")
    private String secretKey;

    @Value("${app.recaptcha.enabled:false}")
    private boolean enabled;

    @Value("${app.recaptcha.min-score:0.5}")
    private double minScore;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Verifies a reCAPTCHA token from the client.
     * For v3 — checks both success and score (>= minScore).
     * For v2 — only checks success.
     * Returns true if verification disabled, secret empty, or check passed.
     */
    public boolean verify(String token, String clientIp) {
        if (!enabled || secretKey == null || secretKey.isBlank()) {
            log.debug("[RecaptchaService] Verification skipped (disabled or no secret)");
            return true;
        }

        if (token == null || token.isBlank()) {
            log.warn("[RecaptchaService] Empty token from IP {}", clientIp);
            return false;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("secret", secretKey);
            params.add("response", token);
            if (clientIp != null) params.add("remoteip", clientIp);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            String response = restTemplate.postForObject(VERIFY_URL, request, String.class);

            if (response == null) {
                log.warn("[RecaptchaService] Null response from Google");
                return false;
            }

            JsonNode root = objectMapper.readTree(response);
            boolean success = root.path("success").asBoolean(false);

            if (!success) {
                String errors = root.path("error-codes").toString();
                log.warn("[RecaptchaService] Verification failed for IP {}: {}", clientIp, errors);
                return false;
            }

            // v3 score check
            if (root.has("score")) {
                double score = root.path("score").asDouble(0.0);
                if (score < minScore) {
                    log.warn("[RecaptchaService] Low score {} for IP {} (min {})", score, clientIp, minScore);
                    return false;
                }
                log.debug("[RecaptchaService] v3 verified IP {} score={}", clientIp, score);
            } else {
                log.debug("[RecaptchaService] v2 verified IP {}", clientIp);
            }

            return true;
        } catch (Exception e) {
            log.error("[RecaptchaService] Verification error: {}", e.getMessage());
            return false;
        }
    }
}
