package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import us.moneybay.model.EmailVerificationToken;
import us.moneybay.model.EmailVerificationToken.TokenPurpose;
import us.moneybay.model.User;

import java.time.Instant;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByToken(String token);

    Optional<EmailVerificationToken> findByTokenAndPurpose(String token, TokenPurpose purpose);

    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.user = :user AND t.purpose = :purpose")
    void deleteByUserAndPurpose(@Param("user") User user, @Param("purpose") TokenPurpose purpose);

    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.expiresAt < :before")
    int deleteExpiredBefore(@Param("before") Instant before);
}
