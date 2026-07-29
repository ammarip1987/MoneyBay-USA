package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import us.moneybay.model.UserRating;
import java.util.List;

@Repository
public interface UserRatingRepository extends JpaRepository<UserRating, Long> {
    List<UserRating> findByRatedUserId(Long userId);
    List<UserRating> findByRaterId(Long raterId);
    long countByRatedUserIdAndRating(Long userId, Integer rating);
}
