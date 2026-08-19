package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import us.moneybay.model.Category;
import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);

    /**
     * Плитки на главной идут по алфавиту. Без сортировки база отдаёт строки в
     * произвольном порядке, и он менялся между запросами.
     */
    List<Category> findAllByOrderByNameAsc();
}
