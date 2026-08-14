package us.moneybay.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import us.moneybay.dto.LoginResponse;
import us.moneybay.model.User;
import us.moneybay.security.JwtTokenProvider;
import us.moneybay.service.OAuth2Service;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/oauth2")
@RequiredArgsConstructor
public class OAuth2Controller {
    private final OAuth2Service oauth2Service;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/callback")
    public ResponseEntity<?> handleOAuth2Callback(
            @RequestParam String provider,
            @RequestParam String accessToken,
            @RequestParam(required = false) String idToken) {

        String token = idToken != null ? idToken : accessToken;
        User user = oauth2Service.handleOAuth2Login(provider, token);

        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to authenticate with " + provider
            ));
        }

        String jwt = jwtTokenProvider.generateToken(user);
        LoginResponse response = new LoginResponse(jwt, user);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String accessToken = request.get("access_token");
        return handleOAuth2Callback("google", accessToken, null);
    }

    @PostMapping("/facebook")
    public ResponseEntity<?> facebookLogin(@RequestBody Map<String, String> request) {
        String accessToken = request.get("access_token");
        return handleOAuth2Callback("facebook", accessToken, null);
    }

    @PostMapping("/apple")
    public ResponseEntity<?> appleLogin(@RequestBody Map<String, String> request) {
        String idToken = request.get("id_token");
        String accessToken = request.get("access_token");
        return handleOAuth2Callback("apple", accessToken, idToken);
    }
}
