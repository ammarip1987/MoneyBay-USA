package us.moneybay.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import us.moneybay.model.Listing;
import us.moneybay.repository.ListingRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/stripe")
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    @Value("${app.stripe.webhook-secret}")
    private String webhookSecret;

    private final ListingRepository listingRepository;

    public StripeWebhookController(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody String payload,
                                           @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.error("Invalid Stripe signature: {}", e.getMessage());
            return ResponseEntity.status(400).body(Map.of("error", "Invalid signature"));
        }

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session != null) {
                String listingIdStr = session.getMetadata().get("listing_id");
                String hoursStr = session.getMetadata().get("hours");
                if (listingIdStr != null && hoursStr != null) {
                    Long listingId = Long.parseLong(listingIdStr);
                    int hours = Integer.parseInt(hoursStr);
                    Optional<Listing> listing = listingRepository.findById(listingId);
                    listing.ifPresent(l -> {
                        l.setPromotedUntil(Instant.now().plus(hours, ChronoUnit.HOURS));
                        l.setFeatured(true);
                        listingRepository.save(l);
                        log.info("Activated boost for listing {} ({}h)", listingId, hours);
                    });
                }
            }
        }

        return ResponseEntity.ok(Map.of("received", true));
    }
}
