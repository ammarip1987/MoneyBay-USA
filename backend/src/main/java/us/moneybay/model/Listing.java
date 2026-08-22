package us.moneybay.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Entity
@Table(name = "listings")
public class Listing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private String location;

    private String area;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "listing_images", joinColumns = @JoinColumn(name = "listing_id"))
    @Column(name = "image_url")
    private List<String> images = new ArrayList<>();

    private Integer views = 0;

    @Column(name = "is_active", nullable = false, columnDefinition = "boolean not null default true")
    private boolean isActive = true;

    @Column(name = "is_featured", nullable = false, columnDefinition = "boolean not null default false")
    private boolean isFeatured = false;

    @Column(name = "is_test", nullable = false, columnDefinition = "boolean not null default false")
    private boolean isTest = false;

    @Column(name = "is_deleted", nullable = false, columnDefinition = "boolean not null default false")
    private boolean isDeleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "auto_hidden", nullable = false, columnDefinition = "boolean not null default false")
    private boolean autoHidden = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ListingStatus status = ListingStatus.ACTIVE;

    /**
     * Причины отклонения через запятую: MISSING_PHOTOS, SHORT_DESCRIPTION и так
     * далее. Показываются автору окном с указанием, что поправить.
     */
    @Column(name = "moderation_reasons", length = 500)
    private String moderationReasons;

    /** Пояснение проверяющего, если стандартных причин мало. */
    @Column(name = "moderation_note", length = 1000)
    private String moderationNote;

    @Column(name = "promoted_until")
    private Instant promotedUntil;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public enum ListingStatus {
        ACTIVE,      // объявление активно
        HIDDEN,      // скрыто по запросу юзера
        FLAGGED,     // объявление с флагами
        BANNED,      // забанено после 20 флагов
        REJECTED,    // отклонено проверкой: причины в moderationReasons
        EXPIRED,     // истекло (опционально для будущего)
        DELETED      // удалено юзером/админом
    }
}
