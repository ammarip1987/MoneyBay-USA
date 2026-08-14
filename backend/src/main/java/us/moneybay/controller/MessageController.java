package us.moneybay.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import us.moneybay.model.Message;
import us.moneybay.model.User;
import us.moneybay.repository.MessageRepository;
import us.moneybay.repository.UserRepository;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class MessageController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageController(MessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/unread-messages-count")
    public ResponseEntity<Map<String, Long>> unreadCount(Authentication auth) {
        if (auth == null) return ResponseEntity.ok(Map.of("count", 0L));
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("count", messageRepository.countByReceiverIdAndIsReadFalse(user.getId())));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<Map<String, Object>>> conversations(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();

        List<Message> allMessages = messageRepository.findAllByParticipant(user.getId());

        Map<Long, Map<String, Object>> conversations = new LinkedHashMap<>();
        for (Message m : allMessages) {
            if (m.getSender() == null || m.getReceiver() == null) continue;
            User other = m.getSender().getId().equals(user.getId()) ? m.getReceiver() : m.getSender();
            conversations.computeIfAbsent(other.getId(), k -> {
                Map<String, Object> conv = new HashMap<>();
                conv.put("id", other.getId());
                conv.put("other_user", other.getUsername());
                conv.put("last_message", m.getContent());
                conv.put("updated_at", m.getCreatedAt());
                conv.put("unread_count", 0L);
                return conv;
            });
        }

        // Count unread per conversation
        conversations.forEach((otherId, conv) -> {
            long unread = allMessages.stream()
                .filter(m -> m.getSender() != null && m.getSender().getId().equals(otherId) && !m.isRead())
                .count();
            conv.put("unread_count", unread);
        });

        return ResponseEntity.ok(new ArrayList<>(conversations.values()));
    }

    @GetMapping("/chats/{otherUserId}/messages")
    public ResponseEntity<List<Map<String, Object>>> getMessages(@PathVariable Long otherUserId, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();

        List<Message> messages = messageRepository.findConversation(user.getId(), otherUserId);

        // Mark received messages as read (single bulk UPDATE)
        messageRepository.markConversationRead(user.getId(), otherUserId);
        messages.forEach(m -> {
            if (m.getReceiver().getId().equals(user.getId())) m.setRead(true);
        });

        return ResponseEntity.ok(messages.stream().map(m -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", m.getId());
            dto.put("content", m.getContent());
            dto.put("sender_id", m.getSender().getId());
            dto.put("receiver_id", m.getReceiver().getId());
            dto.put("is_read", m.isRead());
            dto.put("created_at", m.getCreatedAt());
            return dto;
        }).collect(Collectors.toList()));
    }

    @PostMapping("/chats/{otherUserId}/messages")
    public ResponseEntity<?> send(@PathVariable Long otherUserId,
                                  @RequestBody Map<String, String> body,
                                  Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();

        Optional<User> receiver = userRepository.findById(otherUserId);
        if (receiver.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        Message message = new Message();
        message.setSender(user);
        message.setReceiver(receiver.get());
        message.setContent(body.get("content"));
        message = messageRepository.save(message);

        Map<String, Object> dto = new HashMap<>();
        dto.put("id", message.getId());
        dto.put("content", message.getContent());
        dto.put("sender_id", message.getSender().getId());
        dto.put("receiver_id", message.getReceiver().getId());
        dto.put("is_read", false);
        dto.put("created_at", message.getCreatedAt());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/support/messages")
    public ResponseEntity<?> getSupportMessages(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();

        List<Message> messages = messageRepository.findSupportConversation(user.getId());
        return ResponseEntity.ok(messages.stream().map(m -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", m.getId());
            dto.put("content", m.getContent());
            dto.put("sender_id", m.getSender() != null ? m.getSender().getId() : null);
            dto.put("is_admin", m.getSender() != null && m.getSender().isAdmin());
            dto.put("is_read", m.isRead());
            dto.put("created_at", m.getCreatedAt());
            return dto;
        }).toList());
    }

    @PostMapping("/support/messages")
    public ResponseEntity<?> sendSupport(@RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();

        Optional<User> admin = userRepository.findFirstByIsAdminTrue();
        if (admin.isEmpty()) return ResponseEntity.status(503).body(Map.of("message", "No admin available"));

        Message message = new Message();
        message.setSender(user);
        message.setReceiver(admin.get());
        message.setContent(body.get("content"));
        message.setSupportMessage(true);
        message = messageRepository.save(message);

        Map<String, Object> dto = new HashMap<>();
        dto.put("id", message.getId());
        dto.put("content", message.getContent());
        dto.put("sender_id", message.getSender().getId());
        dto.put("is_admin", false);
        dto.put("created_at", message.getCreatedAt());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/admin/support/users/{userId}/messages")
    public ResponseEntity<?> sendSupportReply(@PathVariable Long userId,
                                              @RequestBody Map<String, String> body,
                                              Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User admin = (User) auth.getPrincipal();
        if (!admin.isAdmin()) return ResponseEntity.status(403).body(Map.of("message", "Admin required"));

        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        Message message = new Message();
        message.setSender(admin);
        message.setReceiver(user.get());
        message.setContent(body.get("content"));
        message.setSupportMessage(true);
        message = messageRepository.save(message);

        Map<String, Object> dto = new HashMap<>();
        dto.put("id", message.getId());
        dto.put("content", message.getContent());
        dto.put("sender_id", admin.getId());
        dto.put("is_admin", true);
        dto.put("created_at", message.getCreatedAt());
        return ResponseEntity.ok(dto);
    }
}
