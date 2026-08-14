package us.moneybay.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import us.moneybay.model.Listing;
import us.moneybay.model.ListingFlag;
import us.moneybay.model.User;
import us.moneybay.repository.ListingFlagRepository;
import us.moneybay.repository.ListingRepository;
import java.time.Instant;

@Service
public class FlagListingService {
    private static final Logger log = LoggerFactory.getLogger(FlagListingService.class);
    private static final long AUTO_BAN_THRESHOLD = 20; // flags until auto-hide

    @Autowired
    private ListingFlagRepository flagRepo;
    
    @Autowired
    private ListingRepository listingRepo;

    public ListingFlag flagListing(Long listingId, User user, 
                                   ListingFlag.FlagReason reason, String description) {
        Listing listing = listingRepo.findById(listingId)
            .orElseThrow(() -> new IllegalArgumentException("Listing not found"));

        // Check if user already flagged this listing
        boolean alreadyFlagged = flagRepo.findByListingIdOrderByCreatedAtDesc(listingId)
            .stream()
            .anyMatch(f -> f.getUser().getId().equals(user.getId()) && 
                          f.getStatus() == ListingFlag.FlagStatus.OPEN);
        
        if (alreadyFlagged) {
            log.warn("User {} already flagged listing {}", user.getId(), listingId);
            throw new IllegalArgumentException("You already flagged this listing");
        }

        ListingFlag flag = new ListingFlag();
        flag.setListing(listing);
        flag.setUser(user);
        flag.setReason(reason);
        flag.setDescription(description);
        flag.setStatus(ListingFlag.FlagStatus.OPEN);
        
        ListingFlag saved = flagRepo.save(flag);
        log.info("Listing {} flagged by user {} (reason: {})", listingId, user.getId(), reason);

        // Check auto-ban threshold
        long flagCount = flagRepo.countByListingIdAndStatus(listingId, ListingFlag.FlagStatus.OPEN);
        if (flagCount >= AUTO_BAN_THRESHOLD) {
            autoBanListing(listing);
        }

        return saved;
    }

    private void autoBanListing(Listing listing) {
        listing.setStatus(Listing.ListingStatus.BANNED);
        // Все выборки фильтруют по isActive — без этого статус BANNED не влияет на выдачу.
        listing.setActive(false);
        listingRepo.save(listing);
        log.warn("Listing {} auto-banned after {} flags", listing.getId(), AUTO_BAN_THRESHOLD);
    }

    public void resolveFlaggedListing(Long listingId, String adminId) {
        flagRepo.findByListingIdOrderByCreatedAtDesc(listingId)
            .stream()
            .filter(f -> f.getStatus() == ListingFlag.FlagStatus.OPEN)
            .forEach(f -> {
                f.setStatus(ListingFlag.FlagStatus.RESOLVED);
                f.setResolvedAt(Instant.now());
                f.setResolvedBy(adminId);
                flagRepo.save(f);
            });
        log.info("Flags for listing {} resolved by admin {}", listingId, adminId);
    }
}
