package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import us.moneybay.model.User;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    Optional<User> findFirstByIsAdminTrue();

    /** Закрытые учётные записи, у которых месяц ожидания вышел. */
    @Query("SELECT u FROM User u WHERE u.deletionScheduledAt IS NOT NULL " +
           "AND u.deletionScheduledAt <= :now")
    List<User> findExpiredForDeletion(@Param("now") java.time.Instant now);
}
