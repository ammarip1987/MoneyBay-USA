package us.moneybay.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDto {

    @Data
    public static class LoginRequest {
        @Email @NotBlank
        private String email;
        @NotBlank
        private String password;
        private String recaptcha_token;
    }

    @Data
    public static class RegisterRequest {
        @Email @NotBlank
        private String email;
        @NotBlank @Size(min = 3)
        private String username;
        @NotBlank @Size(min = 6)
        private String password;
        private String city;
        private String recaptcha_token;
    }

    @Data
    public static class VerifyEmailRequest {
        @NotBlank
        private String token;
    }

    @Data
    public static class ResendVerificationRequest {
        @NotBlank
        private String token;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private UserDto user;

        public AuthResponse(String token, UserDto user) {
            this.token = token;
            this.user = user;
        }
    }
}
