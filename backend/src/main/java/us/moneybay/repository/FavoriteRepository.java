package us.moneybay.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import us.moneybay.model.Favorite;
import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    Optional<Favorite> findByUserIdAndListingId(Long userId, Long listingId);

    /**
     * Объявление и его связи забираются тем же запросом.
     *
     * Без этого список избранного отвечал отказом: listing помечен LAZY, и
     * обращение к нему при сборке ответа приходилось уже на закрытую сессию —
     * LazyInitializationException. Заодно берутся user и category, к которым
     * обращается ListingDto.from.
     */
    @EntityGraph(attributePaths = {"listing", "listing.user", "listing.category"})
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByUserIdAndListingId(Long userId, Long listingId);
}
