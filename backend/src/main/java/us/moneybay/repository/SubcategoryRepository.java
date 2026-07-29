package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import us.moneybay.model.Subcategory;
import java.util.List;

public interface SubcategoryRepository extends JpaRepository<Subcategory, Long> {
    List<Subcategory> findByCategorySlugAndParentIsNull(String categorySlug);
    List<Subcategory> findByParentId(Long parentId);
}
