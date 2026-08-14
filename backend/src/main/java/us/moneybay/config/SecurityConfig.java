package us.moneybay.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import us.moneybay.security.JwtAuthFilter;
import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Patterns (not exact origins): wildcard entries like https://*.moneybay.us
        // must go through setAllowedOriginPatterns to be legal with allowCredentials=true.
        config.setAllowedOriginPatterns(Arrays.asList(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(c -> c.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // public reads
                .requestMatchers(HttpMethod.GET,
                    "/api/listings/**", "/api/categories/**", "/api/cities/**",
                    "/api/subcategories/**", "/api/uploads/**", "/api/photos/**",
                    "/api/users/*/public",
                    "/sitemap.xml", "/robots.txt",
                    "/health", "/actuator/health", "/actuator/info")
                    .permitAll()
                // public writes
                .requestMatchers(HttpMethod.POST,
                    "/api/auth/**", "/api/stripe/webhook", "/api/listings/*/report")
                    .permitAll()
                // websocket handshake + api docs
                .requestMatchers("/ws/**", "/swagger-ui/**", "/v3/api-docs/**")
                    .permitAll()
                // admin-only surfaces
                .requestMatchers("/api/admin/**", "/api/test/**", "/api/listings/*/flag/resolve", "/api/listings/*/restore")
                    .hasRole("ADMIN")
                // everything else requires a valid JWT
                .anyRequest().authenticated())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
