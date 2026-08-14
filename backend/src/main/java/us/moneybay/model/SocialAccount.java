package us.moneybay.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "social_accounts", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"provider", "provider_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SocialAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String provider; // facebook, google, apple

    @Column(nullable = false)
    private String providerId; // ID от провайдера

    private String email;
    private String name;
    private String picture;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
