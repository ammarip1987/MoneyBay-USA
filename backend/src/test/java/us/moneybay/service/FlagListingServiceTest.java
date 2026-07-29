package us.moneybay.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import us.moneybay.model.Listing;
import us.moneybay.model.ListingFlag;
import us.moneybay.model.User;
import us.moneybay.repository.ListingFlagRepository;
import us.moneybay.repository.ListingRepository;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class FlagListingServiceTest {

    @Mock
    private ListingFlagRepository flagRepo;

    @Mock
    private ListingRepository listingRepo;

    @InjectMocks
    private FlagListingService service;

    private Listing listing;
    private User user;
    private ListingFlag savedFlag;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        listing = new Listing();
        listing.setId(1L);
        listing.setTitle("Test listing");
        
        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        
        savedFlag = new ListingFlag();
        savedFlag.setId(1L);
        savedFlag.setStatus(ListingFlag.FlagStatus.OPEN);
    }

    @Test
    void testFlagListingSuccess() {
        when(listingRepo.findById(1L)).thenReturn(Optional.of(listing));
        when(flagRepo.findByListingIdOrderByCreatedAtDesc(1L)).thenReturn(java.util.List.of());
        when(flagRepo.countByListingIdAndStatus(1L, ListingFlag.FlagStatus.OPEN)).thenReturn(1L);
        when(flagRepo.save(any())).thenReturn(savedFlag);

        ListingFlag result = service.flagListing(1L, user, ListingFlag.FlagReason.SPAM, "Spam content");

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(ListingFlag.FlagStatus.OPEN, result.getStatus());
        verify(flagRepo).save(any());
    }

    @Test
    void testFlagListingDuplicate() {
        ListingFlag existingFlag = new ListingFlag();
        existingFlag.setUser(user);
        existingFlag.setStatus(ListingFlag.FlagStatus.OPEN);

        when(listingRepo.findById(1L)).thenReturn(Optional.of(listing));
        when(flagRepo.findByListingIdOrderByCreatedAtDesc(1L)).thenReturn(java.util.List.of(existingFlag));

        assertThrows(IllegalArgumentException.class, () -> 
            service.flagListing(1L, user, ListingFlag.FlagReason.SPAM, "Spam")
        );
    }

    @Test
    void testAutoBanAfter20Flags() {
        when(listingRepo.findById(1L)).thenReturn(Optional.of(listing));
        when(flagRepo.findByListingIdOrderByCreatedAtDesc(1L)).thenReturn(java.util.List.of());
        when(flagRepo.countByListingIdAndStatus(1L, ListingFlag.FlagStatus.OPEN)).thenReturn(20L);
        when(flagRepo.save(any())).thenReturn(savedFlag);
        when(listingRepo.save(listing)).thenReturn(listing);

        service.flagListing(1L, user, ListingFlag.FlagReason.FRAUD_SCAM, "Fraud");

        assertEquals(Listing.ListingStatus.BANNED, listing.getStatus());
        verify(listingRepo, atLeastOnce()).save(listing);
    }

    @Test
    void testListingNotFound() {
        when(listingRepo.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
            service.flagListing(999L, user, ListingFlag.FlagReason.SPAM, "Spam")
        );
    }
}
