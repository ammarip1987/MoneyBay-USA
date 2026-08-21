package us.moneybay.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    private String phone;
    private String city;

    /** Имя файла аватара в хранилище R2; пусто, если не загружен. */
    @Column(name = "avatar_url")
    private String avatarUrl;

    /** Показывать ли фотографию из социальной сети в профиле и объявлениях. */
    @Column(name = "show_avatar", nullable = false,
            columnDefinition = "boolean not null default true")
    private boolean showAvatar = true;

    @Column(name = "is_admin")
    private boolean isAdmin = false;

    @Column(name = "email_verified")
    private boolean emailVerified = false;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
