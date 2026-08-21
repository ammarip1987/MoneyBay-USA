package us.moneybay.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import us.moneybay.dto.ListingDto;
import us.moneybay.dto.UserDto;
import us.moneybay.model.User;
import us.moneybay.repository.ListingRepository;
import us.moneybay.repository.UserRepository;
import us.moneybay.service.R2PhotoService;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final R2PhotoService r2PhotoService;

    public UserController(UserRepository userRepository, ListingRepository listingRepository,
                          R2PhotoService r2PhotoService) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.r2PhotoService = r2PhotoService;
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

    /**
     * Загрузка аватара. Размер подгоняется на клиенте до 400x400, здесь
     * проверяется только тип и вес: даже уменьшенный снимок не должен занимать
     * больше мегабайта.
     */
    @PostMapping("/profile/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file,
                                          Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
        if (file.getSize() > 1_000_000) {
            return ResponseEntity.badRequest().body(Map.of("message", "Avatar must be under 1 MB"));
        }

        String type = file.getContentType();
        if (type == null || !(type.equals("image/jpeg") || type.equals("image/png")
                || type.equals("image/webp"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Allowed: JPEG, PNG, WebP"));
        }

        try {
            User user = (User) auth.getPrincipal();
            String url = r2PhotoService.uploadPhoto(file);
            user.setAvatarUrl(url);
            return ResponseEntity.ok(UserDto.from(userRepository.save(user)));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to upload avatar"));
        }
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
                // Отбор и предел в запросе, а не в приложении: у продавца со
                // 144 тысячами объявлений выборка целиком не укладывалась в
                // отведённое время и страница отвечала 504
                List<ListingDto> listings = listingRepository
                    .findActiveByUser(id, PageRequest.of(0, 48))
                    .stream()
                    .map(ListingDto::from)
                    .toList();

                Map<String, Object> response = new java.util.HashMap<>();
                response.put("id", user.getId());
                response.put("username", user.getUsername());
                response.put("city", user.getCity());
                response.put("avatar_url", user.getAvatarUrl());
                response.put("created_at", user.getCreatedAt());
                response.put("listings_count", listingRepository.countActiveByUser(id));
                response.put("listings", listings);
                return ResponseEntity.ok((Object) response);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
