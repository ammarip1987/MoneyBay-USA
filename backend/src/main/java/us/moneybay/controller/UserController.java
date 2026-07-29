package us.moneybay.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import us.moneybay.dto.ListingDto;
import us.moneybay.dto.UserDto;
import us.moneybay.model.User;
import us.moneybay.repository.ListingRepository;
import us.moneybay.repository.UserRepository;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    public UserController(UserRepository userRepository, ListingRepository listingRepository) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(UserDto.from(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();
        if (body.containsKey("username")) user.setUsername(body.get("username"));
        if (body.containsKey("phone")) user.setPhone(body.get("phone"));
        if (body.containsKey("city")) user.setCity(body.get("city"));
        return ResponseEntity.ok(UserDto.from(userRepository.save(user)));
    }

    @GetMapping("/my-listings")
    public ResponseEntity<List<ListingDto>> myListings(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(
            listingRepository.findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(user.getId())
                .stream().map(ListingDto::from).toList()
        );
    }

    @GetMapping("/users/{id}/public")
    public ResponseEntity<?> publicProfile(@PathVariable Long id) {
        return userRepository.findById(id)
            .map(user -> {
                List<ListingDto> listings = listingRepository.findByUserIdOrderByCreatedAtDesc(id)
                    .stream()
                    .filter(l -> l.isActive())
                    .map(ListingDto::from)
                    .toList();

                Map<String, Object> response = new java.util.HashMap<>();
                response.put("id", user.getId());
                response.put("username", user.getUsername());
                response.put("city", user.getCity());
                response.put("created_at", user.getCreatedAt());
                response.put("listings_count", listings.size());
                response.put("listings", listings);
                return ResponseEntity.ok((Object) response);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
