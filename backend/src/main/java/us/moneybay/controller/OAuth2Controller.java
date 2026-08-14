package us.moneybay.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import us.moneybay.dto.AuthDto;
import us.moneybay.dto.UserDto;
import us.moneybay.model.User;
import us.moneybay.security.JwtUtil;
import us.moneybay.service.OAuth2Service;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/oauth2")
@RequiredArgsConstructor
public class OAuth2Controller {
    private final OAuth2Service oauth2Service;
    private final JwtUtil jwtUtil;

    @PostMapping("/{provider}")
    public ResponseEntity<?> login(@PathVariable String provider,
                                   @RequestBody Map<String, String> body) {
        if (!OAuth2Service.isSupported(provider)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Unsupported provider"));
        }

        // Google/Facebook отдают access_token, Apple — id_token
        String token = body.get("id_token") != null ? body.get("id_token") : body.get("access_token");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing access_token"));
        }

        User user = oauth2Service.handleOAuth2Login(provider, token);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of(
                "message", "Failed to authenticate with " + provider));
        }

        String jwt = jwtUtil.generateToken(user.getId(), user.getEmail());
        return ResponseEntity.ok(new AuthDto.AuthResponse(jwt, UserDto.from(user)));
    }
}
