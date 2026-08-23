package us.moneybay.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import us.moneybay.model.User;

import us.moneybay.repository.UserRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Закрытие учётной записи по требованию владельца.
 *
 * Закрытие не стирает сразу: месяц данные держатся, вход не работает,
 * объявления скрыты. За это время можно вернуться — и если закрытие вышло по
 * ошибке, и если учётную запись закрыл не владелец, а тот, кто получил к ней
 * доступ.
 *
 * По истечении срока запись обезличивается, а не удаляется строкой: записи о
 * платежах ссылаются на неё, и закон требует хранить их для отчётности. Почта,
 * имя, телефон и город стираются — связать запись с человеком становится нечем.
 */
@Service
public class AccountDeletionService {

    private static final Logger log = LoggerFactory.getLogger(AccountDeletionService.class);

    /** Сколько данные держатся после закрытия. */
    private static final Duration GRACE = Duration.ofDays(30);

    @PersistenceContext
    private EntityManager em;

    private final UserRepository userRepository;


    public AccountDeletionService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Закрыть учётную запись: вход перестаёт работать, объявления скрываются. */
    @Transactional
    public Instant scheduleDeletion(User user) {
        Instant when = Instant.now().plus(GRACE);
        user.setDeletionScheduledAt(when);
        userRepository.save(user);

        // Объявления скрываются сразу: держать их видимыми у закрытой учётной
        // записи значит показывать покупателям то, на что никто не ответит
        em.createQuery("UPDATE Listing l SET l.isActive = false WHERE l.user.id = :id")
            .setParameter("id", user.getId())
            .executeUpdate();

        log.info("Учётная запись {} закрыта, стирание {}", user.getId(), when);
        return when;
    }

    /** Отменить закрытие: объявления возвращаются, вход работает. */
    @Transactional
    public void cancelDeletion(User user) {
        user.setDeletionScheduledAt(null);
        userRepository.save(user);

        em.createQuery("UPDATE Listing l SET l.isActive = true " +
                       "WHERE l.user.id = :id AND l.isDeleted = false")
            .setParameter("id", user.getId())
            .executeUpdate();

        log.info("Закрытие учётной записи {} отменено", user.getId());
    }

    /**
     * Стирание просроченных. Раз в сутки.
     *
     * Что удаляется: объявления, снимки, избранное, переписка, флаги.
     * Что остаётся: сама строка пользователя, обезличенная — на неё ссылаются
     * записи о платежах.
     */
    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public void purgeExpired() {
        List<User> expired = userRepository.findExpiredForDeletion(Instant.now());
        if (expired.isEmpty()) return;

        for (User user : expired) {
            Long id = user.getId();

            // Снимки первыми: внешний ключ listing_images без ON DELETE CASCADE
            em.createNativeQuery(
                    "DELETE FROM listing_images WHERE listing_id IN " +
                    "(SELECT id FROM listings WHERE user_id = :id)")
                .setParameter("id", id).executeUpdate();

            for (String table : List.of("favorites", "messages", "listing_flags")) {
                em.createNativeQuery("DELETE FROM " + table + " WHERE user_id = :id")
                    .setParameter("id", id).executeUpdate();
            }

            em.createNativeQuery("DELETE FROM listings WHERE user_id = :id")
                .setParameter("id", id).executeUpdate();

            // Обезличивание: почта и имя заменяются на неповторимые заглушки —
            // столбцы объявлены уникальными, пустыми их оставить нельзя
            user.setEmail("deleted-" + id + "@removed.invalid");
            user.setUsername("deleted-" + id);
            user.setPassword("");
            user.setPhone(null);
            user.setCity(null);
            user.setAvatarUrl(null);
            user.setDeletionScheduledAt(null);
            userRepository.save(user);

            log.info("Учётная запись {} обезличена", id);
        }

        log.info("Стёрто учётных записей: {}", expired.size());
    }
}
