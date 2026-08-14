package us.moneybay.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CityContextFilter extends OncePerRequestFilter {

    private static final Set<String> RESERVED = Set.of("www", "api", "admin", "localhost");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            String subdomain = resolveSubdomain(request);
            if (subdomain != null) {
                CityContext.setSubdomain(subdomain);
            }
            chain.doFilter(request, response);
        } finally {
            CityContext.clear();
        }
    }

    private String resolveSubdomain(HttpServletRequest request) {
        String headerOverride = request.getHeader("X-City-Subdomain");
        if (headerOverride != null && !headerOverride.isBlank()) {
            return headerOverride.toLowerCase();
        }

        String host = request.getHeader("Host");
        if (host == null) return null;

        int colon = host.indexOf(':');
        if (colon >= 0) host = host.substring(0, colon);

        host = host.toLowerCase();
        if (host.equals("localhost") || host.equals("127.0.0.1") || isIpAddress(host)) {
            return null;
        }

        String[] parts = host.split("\\.");
        // apex-домен (moneybay.us) — без subdomain; newyork.localhost — subdomain из двух частей
        boolean localhostHost = parts[parts.length - 1].equals("localhost");
        int minParts = localhostHost ? 2 : 3;
        if (parts.length < minParts) return null;

        String candidate = parts[0];
        if (RESERVED.contains(candidate)) return null;
        return candidate;
    }

    private boolean isIpAddress(String host) {
        return host.matches("^\\d{1,3}(\\.\\d{1,3}){3}$");
    }
}
