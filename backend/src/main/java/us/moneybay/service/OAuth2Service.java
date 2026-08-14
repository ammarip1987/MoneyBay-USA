package us.moneybay.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import us.moneybay.model.SocialAccount;
import us.moneybay.model.User;
import us.moneybay.repository.SocialAccountRepository;
import us.moneybay.repository.UserRepository;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OAuth2Service {
    private final SocialAccountRepository socialAccountRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate;

    @Transactional
    public User handleOAuth2Login(String provider, String accessToken) {
        Map<String, Object> userInfo = fetchUserInfo(provider, accessToken);
        if (userInfo == null) return null;

        String providerId = String.valueOf(userInfo.get("id"));
        String email = (String) userInfo.get("email");
        String name = (String) userInfo.get("name");
        String picture = (String) userInfo.get("picture");

        Optional<SocialAccount> existing = socialAccountRepository
            .findByProviderAndProviderId(provider, providerId);

        if (existing.isPresent()) {
            return existing.get().getUser();
        }

        User user;
        if (email != null) {
            Optional<User> existingEmail = userRepository.findByEmail(email);
            if (existingEmail.isPresent()) {
                user = existingEmail.get();
            } else {
                user = createUserFromOAuth(email, name);
            }
        } else {
            user = createUserFromOAuth("oauth_" + UUID.randomUUID(), name);
        }

        SocialAccount socialAccount = new SocialAccount();
        socialAccount.setUser(user);
        socialAccount.setProvider(provider);
        socialAccount.setProviderId(providerId);
        socialAccount.setEmail(email);
        socialAccount.setName(name);
        socialAccount.setPicture(picture);
        socialAccountRepository.save(socialAccount);

        return user;
    }

    private User createUserFromOAuth(String email, String name) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(name != null ? name : email.split("@")[0]);
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setEmailVerified(true);
        user.setAdmin(false);
        return userRepository.save(user);
    }

    private Map<String, Object> fetchUserInfo(String provider, String accessToken) {
        try {
            return switch (provider.toLowerCase()) {
                case "google" -> fetchGoogleUserInfo(accessToken);
                case "facebook" -> fetchFacebookUserInfo(accessToken);
                case "apple" -> fetchAppleUserInfo(accessToken);
                default -> null;
            };
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> fetchGoogleUserInfo(String accessToken) {
        String url = "https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken;
        return restTemplate.getForObject(url, Map.class);
    }

    private Map<String, Object> fetchFacebookUserInfo(String accessToken) {
        String url = "https://graph.facebook.com/me?fields=id,email,name,picture&access_token=" + accessToken;
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response != null && response.containsKey("picture")) {
            Map<String, Object> pic = (Map<String, Object>) response.get("picture");
            if (pic.containsKey("data")) {
                response.put("picture", ((Map<String, Object>) pic.get("data")).get("url"));
            }
        }
        return response;
    }

    private Map<String, Object> fetchAppleUserInfo(String idToken) {
        // Apple sends data in JWT, need to decode
        // For now, basic implementation
        return Map.of(
            "id", "apple_" + System.currentTimeMillis(),
            "email", "",
            "name", "Apple User"
        );
    }
}
