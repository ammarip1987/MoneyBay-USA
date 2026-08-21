package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import us.moneybay.model.Storefront;
import java.util.Optional;

public interface StorefrontRepository extends JpaRepository<Storefront, Long> {
    Optional<Storefront> findByUserId(Long userId);
    Optional<Storefront> findBySlug(String slug);
    boolean existsBySlug(String slug);
    Optional<Storefront> findByStripeAccountId(String stripeAccountId);
}
