package us.moneybay.controller;

import com.stripe.exception.StripeException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import us.moneybay.model.Listing;
import us.moneybay.model.User;
import us.moneybay.repository.ListingRepository;
import us.moneybay.service.StripeService;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;

@lombok.extern.slf4j.Slf4j
@RestController
@RequestMapping("/api/boost")
public class BoostController {

    private final ListingRepository listingRepository;
    private final StripeService stripeService;

    @Value("${app.stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${app.frontend.url:http://localhost:1100}")
    private String frontendUrl;

    public BoostController(ListingRepository listingRepository, StripeService stripeService) {
        this.listingRepository = listingRepository;
        this.stripeService = stripeService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> createCheckout(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        User user = (User) auth.getPrincipal();

        Object listingIdRaw = body.get("listing_id");
        Object hoursRaw = body.get("hours");
        if (listingIdRaw == null || hoursRaw == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "listing_id and hours are required"));
        }
        Long listingId;
        int hours;
        try {
            listingId = Long.parseLong(listingIdRaw.toString());
            hours = Integer.parseInt(hoursRaw.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "listing_id and hours must be numbers"));
        }
        if (hours < 1 || hours > 720) {
            return ResponseEntity.badRequest().body(Map.of("message", "hours out of range"));
        }

        Optional<Listing> listing = listingRepository.findById(listingId);
        if (listing.isEmpty() || !listing.get().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Not allowed"));
        }

        // Dev mode: no real Stripe key configured -> activate boost directly,
        // so the full flow is testable locally. In prod (real key) Stripe Checkout runs.
        if (stripeSecretKey == null || stripeSecretKey.contains("dummy")) {
            Listing l = listing.get();
            l.setPromotedUntil(Instant.now().plus(hours, ChronoUnit.HOURS));
            l.setFeatured(true);
            listingRepository.save(l);
            // Продвижение без оплаты: ключа Stripe нет, срок ставится сразу.
            // Сумма в записи не нужна — платежа не было
            log.info("event=boost_activated listing_id={} hours={} mode=dev", listingId, hours);
            return ResponseEntity.ok(Map.of(
                "checkout_url", frontendUrl + "/listing/" + listingId + "?boosted=true",
                "dev_mode", true,
                "promoted_until", l.getPromotedUntil().toString()
            ));
        }

        try {
            String checkoutUrl = stripeService.createBoostCheckout(listingId, hours, user.getId());
            return ResponseEntity.ok(Map.of("checkout_url", checkoutUrl));
        } catch (StripeException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Stripe error: " + e.getMessage()));
        }
    }
}
