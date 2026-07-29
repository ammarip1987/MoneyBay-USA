package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import us.moneybay.model.KeywordFilter;
import java.util.List;

@Repository
public interface KeywordFilterRepository extends JpaRepository<KeywordFilter, Long> {
    @Query("SELECT k FROM KeywordFilter k WHERE k.active = TRUE ORDER BY k.word")
    List<KeywordFilter> findActiveFilters();
    
    List<KeywordFilter> findByActiveTrue();
    
    boolean existsByWordIgnoreCase(String word);
}
