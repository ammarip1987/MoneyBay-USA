package us.moneybay.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import us.moneybay.dto.ListingDto;
import us.moneybay.dto.UserDto;
import us.moneybay.model.Listing;
import us.moneybay.model.Message;
import us.moneybay.model.User;
import us.moneybay.repository.ListingRepository;
import us.moneybay.repository.MessageRepository;
import us.moneybay.repository.UserRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final MessageRepository messageRepository;

    public AdminController(UserRepository userRepository,
                           ListingRepository listingRepository,
                           MessageRepository messageRepository) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.messageRepository = messageRepository;
    }

    private boolean isAdmin(Authentication auth) {
        if (auth == null) return false;
        User user = (User) auth.getPrincipal();
        return user.isAdmin();
    }

    @GetMapping("/users")
    public ResponseEntity<?> users(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(Map.of("message", "Admin required"));
        return ResponseEntity.ok(userRepository.findAll().stream().map(UserDto::from).toList());
    }

    @PostMapping("/users/{id}/toggle-admin")
    public ResponseEntity<?> toggleAdmin(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(Map.of("message", "Admin required"));
        User current = (User) auth.getPrincipal();
        if (current.getId().equals(id)) {
            return ResponseEntity.status(400).body(Map.of("message", "Cannot change own admin status"));
        }
        return userRepository.findById(id).map(u -> {
            u.setAdmin(!u.isAdmin());
            return ResponseEntity.ok((Object) UserDto.from(userRepository.save(u)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(Map.of("message", "Admin required"));
        User current = (User) auth.getPrincipal();
        if (current.getId().equals(id)) {
            return ResponseEntity.status(400).body(Map.of("message", "Cannot delete own account"));
        }
        try {
            userRepository.deleteById(id);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(409).body(Map.of("message", "User has related data (listings/messages) and cannot be deleted"));
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/listings")
    public ResponseEntity<?> listings(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(Map.of("message", "Admin required"));
        List<ListingDto> all = listingRepository.findAll().stream().map(ListingDto::from).toList();
        return ResponseEntity.ok(all);
    }

    @PostMapping("/listings/{id}/toggle-active")
    public ResponseEntity<?> toggleListing(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(Map.of("message", "Admin required"));
        return listingRepository.findById(id).map(l -> {
            l.setActive(!l.isActive());
            return ResponseEntity.ok((Object) ListingDto.from(listingRepository.save(l)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/listings/{id}")
    public ResponseEntity<?> deleteListing(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(Map.of("message", "Admin required"));
        listingRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/listings/{id}/chats")
    public ResponseEntity<?> listingChats(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(Map.of("message", "Admin required"));

        Listing listing = listingRepository.findById(id).orElse(null);
        if (listing == null) return ResponseEntity.notFound().build();

        Long sellerId = listing.getUser() != null ? listing.getUser().getId() : null;
        List<Long> buyerIds = sellerId != null
            ? messageRepository.findBuyerIdsByListingId(id, sellerId)
            : List.of();

        List<Message> allMessages = messageRepository.findByListingId(id);
        Map<Long, User> buyers = new HashMap<>();
        userRepository.findAllById(buyerIds).forEach(u -> buyers.put(u.getId(), u));

        List<Map<String, Object>> conversations = buyerIds.stream().map(buyerId -> {
            User buyer = buyers.get(buyerId);
            List<Message> conv = allMessages.stream()
                .filter(m -> (m.getSender() != null && m.getSender().getId().equals(buyerId))
                          || (m.getReceiver() != null && m.getReceiver().getId().equals(buyerId)))
                .toList();

            Map<String, Object> entry = new HashMap<>();
            entry.put("buyer_id", buyerId);
            entry.put("buyer_username", buyer != null ? buyer.getUsername() : null);
            entry.put("messages", conv.stream().map(m -> Map.of(
                "id", m.getId(),
                "content", m.getContent(),
                "sender_id", m.getSender() != null ? m.getSender().getId() : null,
                "receiver_id", m.getReceiver() != null ? m.getReceiver().getId() : null,
                "is_read", m.isRead(),
                "created_at", m.getCreatedAt()
            )).toList());
            return entry;
        }).toList();

        Map<String, Object> response = new HashMap<>();
        response.put("listing_id", id);
        response.put("listing_title", listing.getTitle());
        response.put("seller_id", sellerId);
        response.put("conversations", conversations);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/support/users")
    public ResponseEntity<?> supportUsers(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(Map.of("message", "Admin required"));

        List<Long> userIds = messageRepository.findUsersWithSupportMessages();
        Map<Long, User> usersById = new HashMap<>();
        userRepository.findAllById(userIds).forEach(u -> usersById.put(u.getId(), u));
        List<Map<String, Object>> result = userIds.stream().map(uid -> {
            User u = usersById.get(uid);
            Map<String, Object> entry = new HashMap<>();
            entry.put("user_id", uid);
            entry.put("username", u != null ? u.getUsername() : null);
            entry.put("email", u != null ? u.getEmail() : null);
            return entry;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/support/users/{userId}/messages")
    public ResponseEntity<?> supportConversation(@PathVariable Long userId, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(Map.of("message", "Admin required"));

        List<Map<String, Object>> messages = messageRepository.findSupportConversation(userId).stream()
            .map(m -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", m.getId());
                map.put("content", m.getContent());
                map.put("sender_id", m.getSender() != null ? m.getSender().getId() : null);
                map.put("is_admin", m.getSender() != null && m.getSender().isAdmin());
                map.put("created_at", m.getCreatedAt());
                return map;
            })
            .toList();

        return ResponseEntity.ok(messages);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(Map.of("message", "Admin required"));
        return ResponseEntity.ok(Map.of(
            "total_users", userRepository.count(),
            "total_listings", listingRepository.count(),
            "active_listings", listingRepository.countByIsActiveTrueAndIsDeletedFalse()
        ));
    }
}
