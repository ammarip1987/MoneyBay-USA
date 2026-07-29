package us.moneybay.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@NoArgsConstructor
@Entity
@Table(name = "user_ratings")
public class UserRating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rated_user_id", nullable = false)
    private User ratedUser; // продавец/покупатель который получает рейтинг

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rater_id", nullable = false)
    private User rater; // кто выставил рейтинг

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    private Listing listing; // какое объявление

    @Column(nullable = false)
    private Integer rating; // 1-5 звезд

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RatingCategory category; // COMMUNICATION, ITEM_QUALITY, SELLER_TRUST, BUYER_TRUST

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public enum RatingCategory {
        COMMUNICATION,    // как быстро ответил
        ITEM_QUALITY,     // соответствие описанию
        SELLER_TRUST,     // честный ли продавец
        BUYER_TRUST       // серьезный ли покупатель
    }
}
