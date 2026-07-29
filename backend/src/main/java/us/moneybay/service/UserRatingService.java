package us.moneybay.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import us.moneybay.model.User;
import us.moneybay.model.UserRating;
import us.moneybay.model.Listing;
import us.moneybay.repository.UserRatingRepository;
import java.util.List;

@Service
public class UserRatingService {
    private static final Logger log = LoggerFactory.getLogger(UserRatingService.class);

    @Autowired
    private UserRatingRepository ratingRepo;

    public UserRating rateUser(User ratedUser, User rater, Listing listing, 
                               Integer rating, String comment, UserRating.RatingCategory category) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        // Проверить что рейтер и rated_user это разные люди
        if (ratedUser.getId().equals(rater.getId())) {
            throw new IllegalArgumentException("Cannot rate yourself");
        }

        UserRating ur = new UserRating();
        ur.setRatedUser(ratedUser);
        ur.setRater(rater);
        ur.setListing(listing);
        ur.setRating(rating);
        ur.setComment(comment);
        ur.setCategory(category);

        UserRating saved = ratingRepo.save(ur);
        log.info("User {} rated {} with {} stars", rater.getId(), ratedUser.getId(), rating);
        return saved;
    }

    @Cacheable("user-ratings")
    public UserRatingStats getUserRatingStats(Long userId) {
        List<UserRating> ratings = ratingRepo.findByRatedUserId(userId);
        
        if (ratings.isEmpty()) {
            return new UserRatingStats(userId, 0, 0.0);
        }

        double avgRating = ratings.stream()
            .mapToInt(UserRating::getRating)
            .average()
            .orElse(0.0);

        return new UserRatingStats(userId, ratings.size(), Math.round(avgRating * 10.0) / 10.0);
    }

    public static class UserRatingStats {
        public Long userId;
        public int totalRatings;
        public double averageRating;

        public UserRatingStats(Long userId, int totalRatings, double averageRating) {
            this.userId = userId;
            this.totalRatings = totalRatings;
            this.averageRating = averageRating;
        }
    }
}
