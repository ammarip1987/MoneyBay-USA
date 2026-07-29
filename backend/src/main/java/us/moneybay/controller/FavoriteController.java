package us.moneybay.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import us.moneybay.dto.ListingDto;
import us.moneybay.model.Favorite;
import us.moneybay.model.Listing;
import us.moneybay.model.User;
import us.moneybay.repository.FavoriteRepository;
import us.moneybay.repository.ListingRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final ListingRepository listingRepository;

    public FavoriteController(FavoriteRepository favoriteRepository, ListingRepository listingRepository) {
        this.favoriteRepository = favoriteRepository;
        this.listingRepository = listingRepository;
    }

    @GetMapping("/api/favorites")
    public ResponseEntity<List<ListingDto>> list(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(
            favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(f -> ListingDto.from(f.getListing())).toList()
        );
    }

    @PostMapping("/listing/{listingId}/like")
    public ResponseEntity<Map<String, Object>> toggle(@PathVariable Long listingId, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();

        Optional<Favorite> existing = favoriteRepository.findByUserIdAndListingId(user.getId(), listingId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return ResponseEntity.ok(Map.of("success", true, "liked", false));
        }

        Optional<Listing> listing = listingRepository.findById(listingId);
        if (listing.isEmpty()) return ResponseEntity.status(404).body(Map.of("success", false, "liked", false));

        Favorite fav = new Favorite();
        fav.setUser(user);
        fav.setListing(listing.get());
        favoriteRepository.save(fav);
        return ResponseEntity.ok(Map.of("success", true, "liked", true));
    }
}
