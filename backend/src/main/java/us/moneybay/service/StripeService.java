package us.moneybay.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class StripeService {

    private static final Logger log = LoggerFactory.getLogger(StripeService.class);

    @Value("${app.stripe.secret-key}")
    private String secretKey;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    public String createBoostCheckout(Long listingId, int hours, Long userId) throws StripeException {
        double price = switch (hours) {
            case 24 -> 1.99;
            case 48 -> 3.49;
            case 72 -> 4.99;
            default -> throw new IllegalArgumentException("Invalid boost duration");
        };

        SessionCreateParams params = SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.PAYMENT)
            .setSuccessUrl(frontendUrl + "/listing/" + listingId + "?boosted=true")
            .setCancelUrl(frontendUrl + "/promote/" + listingId)
            .addLineItem(SessionCreateParams.LineItem.builder()
                .setQuantity(1L)
                .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                    .setCurrency("usd")
                    .setUnitAmount((long) (price * 100))
                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                        .setName(hours + "h Boost for Listing #" + listingId)
                        .build())
                    .build())
                .build())
            .putMetadata("listing_id", listingId.toString())
            .putMetadata("hours", String.valueOf(hours))
            .putMetadata("user_id", userId.toString())
            .build();

        Session session = Session.create(params);
        log.info("Created Stripe checkout session {} for listing {} ({}h)", session.getId(), listingId, hours);
        return session.getUrl();
    }
}
