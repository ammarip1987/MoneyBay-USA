package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import us.moneybay.model.ListingFlag;
import java.util.List;

@Repository
public interface ListingFlagRepository extends JpaRepository<ListingFlag, Long> {
    long countByListingIdAndStatus(Long listingId, ListingFlag.FlagStatus status);
    
    @Query("SELECT COUNT(f) FROM ListingFlag f WHERE f.listing.id = ?1 AND f.status = 'OPEN'")
    long countOpenFlags(Long listingId);
    
    List<ListingFlag> findByListingIdOrderByCreatedAtDesc(Long listingId);
}
