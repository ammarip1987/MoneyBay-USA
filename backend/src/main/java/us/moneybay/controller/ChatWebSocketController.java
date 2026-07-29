package us.moneybay.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import us.moneybay.model.Message;
import us.moneybay.model.User;
import us.moneybay.repository.MessageRepository;
import us.moneybay.repository.UserRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public ChatWebSocketController(SimpMessagingTemplate messagingTemplate,
                                   MessageRepository messageRepository,
                                   UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload Map<String, Object> payload, Authentication auth) {
        if (auth == null) return;
        User sender = (User) auth.getPrincipal();
        Long receiverId = Long.parseLong(payload.get("receiver_id").toString());
        String content = (String) payload.get("content");
        String clientId = payload.get("client_id") != null ? payload.get("client_id").toString() : null;

        Optional<User> receiver = userRepository.findById(receiverId);
        if (receiver.isEmpty()) return;

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver.get());
        message.setContent(content);
        message = messageRepository.save(message);

        Map<String, Object> dto = new HashMap<>();
        dto.put("type", "message");
        dto.put("id", message.getId());
        dto.put("client_id", clientId);
        dto.put("content", message.getContent());
        dto.put("sender_id", sender.getId());
        dto.put("sender_username", sender.getUsername());
        dto.put("receiver_id", receiverId);
        dto.put("is_read", false);
        dto.put("delivered_at", Instant.now());
        dto.put("created_at", message.getCreatedAt());

        messagingTemplate.convertAndSendToUser(receiver.get().getEmail(), "/queue/messages", dto);

        Map<String, Object> deliveryReceipt = new HashMap<>();
        deliveryReceipt.put("type", "delivery_receipt");
        deliveryReceipt.put("message_id", message.getId());
        deliveryReceipt.put("client_id", clientId);
        deliveryReceipt.put("delivered_at", Instant.now());
        messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/receipts", deliveryReceipt);
    }

    @MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, Object> payload, Authentication auth) {
        if (auth == null) return;
        User sender = (User) auth.getPrincipal();
        Long receiverId = Long.parseLong(payload.get("receiver_id").toString());
        boolean typing = payload.get("typing") == null || Boolean.parseBoolean(payload.get("typing").toString());

        Optional<User> receiver = userRepository.findById(receiverId);
        if (receiver.isEmpty()) return;

        Map<String, Object> dto = new HashMap<>();
        dto.put("type", "typing");
        dto.put("from_user_id", sender.getId());
        dto.put("from_username", sender.getUsername());
        dto.put("typing", typing);
        dto.put("at", Instant.now());

        messagingTemplate.convertAndSendToUser(receiver.get().getEmail(), "/queue/typing", dto);
    }

    @MessageMapping("/chat.read")
    public void markRead(@Payload Map<String, Object> payload, Authentication auth) {
        if (auth == null) return;
        User reader = (User) auth.getPrincipal();
        Long otherUserId = Long.parseLong(payload.get("other_user_id").toString());

        List<Message> conversation = messageRepository.findConversation(reader.getId(), otherUserId);
        List<Long> markedIds = new java.util.ArrayList<>();
        Instant readAt = Instant.now();

        for (Message m : conversation) {
            if (m.getReceiver() != null && m.getReceiver().getId().equals(reader.getId()) && !m.isRead()) {
                m.setRead(true);
                messageRepository.save(m);
                markedIds.add(m.getId());
            }
        }

        if (markedIds.isEmpty()) return;

        Optional<User> otherUser = userRepository.findById(otherUserId);
        if (otherUser.isPresent()) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("type", "read_receipt");
            dto.put("reader_id", reader.getId());
            dto.put("message_ids", markedIds);
            dto.put("read_at", readAt);
            messagingTemplate.convertAndSendToUser(otherUser.get().getEmail(), "/queue/receipts", dto);
        }
    }
}
