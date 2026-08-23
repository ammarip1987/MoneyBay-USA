package us.moneybay.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import us.moneybay.service.AccountDeletionService;
import us.moneybay.dto.ListingDto;
import us.moneybay.dto.UserDto;
import us.moneybay.model.User;
import us.moneybay.repository.ListingRepository;
import us.moneybay.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountDeletionService accountDeletionService;

    public UserController(UserRepository userRepository,
                          ListingRepository listingRepository,
                          PasswordEncoder passwordEncoder,
                          AccountDeletionService accountDeletionService) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountDeletionService = accountDeletionService;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(UserDto.from(user));
    }

    /**
     * Закрыть учётную запись.
     *
     * Данные держатся месяц: за это время можно вернуться, если закрытие вышло
     * по ошибке или учётную запись закрыл не владелец. Пароль спрашивается,
     * чтобы чужой человек за оставленным без присмотра устройством не закрыл
     * её нажатием кнопки.
     */
    @PostMapping("/profile/delete")
    public ResponseEntity<?> deleteAccount(Authentication auth,
                                           @RequestBody Map<String, String> body) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();

        String password = body.get("password");
        if (password == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(403).body(Map.of(
                "code", "PASSWORD_INVALID",
                "message", "Password is incorrect"
            ));
        }

        Instant when = accountDeletionService.scheduleDeletion(user);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "deletion_scheduled_at", when.toString()
        ));
    }

    /** Передумал: объявления возвращаются, вход работает. */
    @PostMapping("/profile/delete/cancel")
    public ResponseEntity<?> cancelDeletion(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();

        accountDeletionService.cancelDeletion(user);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();
        if (body.containsKey("username")) user.setUsername(str(body.get("username")));
        if (body.containsKey("phone")) user.setPhone(str(body.get("phone")));
        if (body.containsKey("city")) user.setCity(str(body.get("city")));
        // Показ фотографии из социальной сети: сама она не меняется, скрывается
        // только вывод — как это устроено на других площадках
        if (body.containsKey("showAvatar")) {
            user.setShowAvatar(Boolean.TRUE.equals(body.get("showAvatar")));
        }
        return ResponseEntity.ok(UserDto.from(userRepository.save(user)));
    }

    private static String str(Object value) {
        return value == null ? null : value.toString();
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
                // Скрытая фотография не отдаётся вовсе
                response.put("avatar_url", user.isShowAvatar() ? user.getAvatarUrl() : null);
                response.put("created_at", user.getCreatedAt());
                response.put("listings_count", listingRepository.countActiveByUser(id));
                response.put("listings", listings);
                return ResponseEntity.ok((Object) response);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
