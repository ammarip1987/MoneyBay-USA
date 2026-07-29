package us.moneybay.service;

import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import us.moneybay.model.EmailVerificationToken;
import us.moneybay.model.EmailVerificationToken.TokenPurpose;
import us.moneybay.model.User;
import us.moneybay.repository.EmailVerificationTokenRepository;
import us.moneybay.repository.UserRepository;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Optional;

@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${app.email-verification.token-ttl-hours:24}")
    private int verificationTtlHours;

    @Value("${app.password-reset.token-ttl-minutes:60}")
    private int passwordResetTtlMinutes;

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public EmailVerificationService(EmailVerificationTokenRepository tokenRepository,
                                    UserRepository userRepository,
                                    EmailService emailService) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Transactional
    public void issueVerificationToken(User user) {
        tokenRepository.deleteByUserAndPurpose(user, TokenPurpose.EMAIL_VERIFICATION);
        String token = generateToken();
        EmailVerificationToken evt = new EmailVerificationToken();
        evt.setToken(token);
        evt.setUser(user);
        evt.setPurpose(TokenPurpose.EMAIL_VERIFICATION);
        evt.setExpiresAt(Instant.now().plus(verificationTtlHours, ChronoUnit.HOURS));
        tokenRepository.save(evt);
        emailService.sendVerificationEmail(user.getEmail(), token);
        log.info("[EmailVerification] Issued token for user {}", user.getEmail());
    }

    @Transactional
    public void issuePasswordResetToken(User user) {
        tokenRepository.deleteByUserAndPurpose(user, TokenPurpose.PASSWORD_RESET);
        String token = generateToken();
        EmailVerificationToken evt = new EmailVerificationToken();
        evt.setToken(token);
        evt.setUser(user);
        evt.setPurpose(TokenPurpose.PASSWORD_RESET);
        evt.setExpiresAt(Instant.now().plus(passwordResetTtlMinutes, ChronoUnit.MINUTES));
        tokenRepository.save(evt);
        emailService.sendPasswordResetEmail(user.getEmail(), token);
        log.info("[EmailVerification] Issued password reset token for user {}", user.getEmail());
    }

    @Transactional
    public boolean verifyEmail(String token) {
        Optional<EmailVerificationToken> opt = tokenRepository.findByTokenAndPurpose(token, TokenPurpose.EMAIL_VERIFICATION);
        if (opt.isEmpty()) {
            log.warn("[EmailVerification] Token not found: {}", token);
            return false;
        }
        EmailVerificationToken evt = opt.get();
        if (!evt.isValid()) {
            log.warn("[EmailVerification] Token invalid (used or expired): {}", token);
            return false;
        }
        User user = evt.getUser();
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(Instant.now());
        userRepository.save(user);
        evt.setUsedAt(Instant.now());
        tokenRepository.save(evt);
        log.info("[EmailVerification] Verified email for user {}", user.getEmail());
        return true;
    }

    @Transactional
    public Optional<User> consumePasswordResetToken(String token) {
        Optional<EmailVerificationToken> opt = tokenRepository.findByTokenAndPurpose(token, TokenPurpose.PASSWORD_RESET);
        if (opt.isEmpty() || !opt.get().isValid()) {
            return Optional.empty();
        }
        EmailVerificationToken evt = opt.get();
        evt.setUsedAt(Instant.now());
        tokenRepository.save(evt);
        return Optional.of(evt.getUser());
    }

    private String generateToken() {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cleanupExpiredTokens() {
        int deleted = tokenRepository.deleteExpiredBefore(Instant.now().minus(7, ChronoUnit.DAYS));
        if (deleted > 0) {
            log.info("[EmailVerification] Cleaned up {} expired tokens", deleted);
        }
    }
}
