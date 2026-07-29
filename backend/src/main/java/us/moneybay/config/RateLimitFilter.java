package us.moneybay.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    @Value("${app.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${app.rate-limit.requests-per-minute:60}")
    private int requestsPerMinute;

    @Value("${app.rate-limit.auth-per-minute:5}")
    private int authRequestsPerMinute;

    @Value("${app.rate-limit.write-per-minute:20}")
    private int writeRequestsPerMinute;

    private final Map<String, Bucket> generalBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> writeBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if (!enabled) {
            chain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String method = request.getMethod();
        String clientIp = resolveClientIp(request);

        // Skip rate limiting for static, websocket, actuator, swagger
        if (isExempt(path)) {
            chain.doFilter(request, response);
            return;
        }

        Bucket bucket = selectBucket(path, method, clientIp);
        if (bucket.tryConsume(1)) {
            response.setHeader("X-RateLimit-Remaining", String.valueOf(bucket.getAvailableTokens()));
            chain.doFilter(request, response);
        } else {
            log.warn("[RateLimitFilter] Rejected request from IP {} path {} method {}", clientIp, path, method);
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType("application/json");
            response.getWriter().write("""
                {"error":"rate_limit_exceeded","message":"Too many requests. Try again in 1 minute."}""");
        }
    }

    private Bucket selectBucket(String path, String method, String clientIp) {
        // Auth endpoints: stricter limit
        if (path.startsWith("/api/auth/")) {
            return authBuckets.computeIfAbsent(clientIp, ip -> Bucket.builder()
                .addLimit(Bandwidth.simple(authRequestsPerMinute, Duration.ofMinutes(1)))
                .build());
        }
        // Write operations: medium limit
        if ("POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method) || "PATCH".equals(method)) {
            return writeBuckets.computeIfAbsent(clientIp, ip -> Bucket.builder()
                .addLimit(Bandwidth.simple(writeRequestsPerMinute, Duration.ofMinutes(1)))
                .build());
        }
        // General read: relaxed limit
        return generalBuckets.computeIfAbsent(clientIp, ip -> Bucket.builder()
            .addLimit(Bandwidth.simple(requestsPerMinute, Duration.ofMinutes(1)))
            .build());
    }

    private boolean isExempt(String path) {
        return path.startsWith("/actuator/")
            || path.startsWith("/ws")
            || path.startsWith("/swagger-ui")
            || path.startsWith("/v3/api-docs")
            || path.startsWith("/api/uploads/")
            || path.equals("/sitemap.xml")
            || path.equals("/robots.txt");
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }
}
