package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import us.moneybay.model.Subcategory;
import java.util.List;

public interface SubcategoryRepository extends JpaRepository<Subcategory, Long> {
    List<Subcategory> findByCategorySlugAndParentIsNullOrderBySortOrderAscNameAsc(String categorySlug);
    List<Subcategory> findByParentIdOrderBySortOrderAscNameAsc(Long parentId);

    /** Третий уровень удаляется первым: на него ссылается parent_id. */
    @Modifying
    @Transactional
    @Query("DELETE FROM Subcategory s WHERE s.parent IS NOT NULL")
    void deleteAllByParentIsNotNull();
}
