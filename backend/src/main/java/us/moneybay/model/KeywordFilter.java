package us.moneybay.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@NoArgsConstructor
@Entity
@Table(name = "keyword_filters", indexes = {
    @Index(name = "idx_word", columnList = "word"),
    @Index(name = "idx_active", columnList = "active")
})
public class KeywordFilter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String word;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FilterCategory category;

    @Column(nullable = false)
    private Integer severity = 1; // 1=warn, 2=hide, 3=auto-ban

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public enum FilterCategory {
        SPAM,
        PROHIBITED_ITEM,
        ABUSE
    }
}
