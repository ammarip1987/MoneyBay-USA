package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import us.moneybay.model.SocialAccount;
import java.util.Optional;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {
    Optional<SocialAccount> findByProviderAndProviderId(String provider, String providerId);
    Optional<SocialAccount> findByUserIdAndProvider(Long userId, String provider);
}
