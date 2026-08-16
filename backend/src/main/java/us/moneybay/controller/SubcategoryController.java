package us.moneybay.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import us.moneybay.dto.SubcategoryDto;
import us.moneybay.repository.SubcategoryRepository;
import java.util.List;

@RestController
@RequestMapping("/api/subcategories")
public class SubcategoryController {

    private final SubcategoryRepository subcategoryRepository;

    public SubcategoryController(SubcategoryRepository subcategoryRepository) {
        this.subcategoryRepository = subcategoryRepository;
    }

    @GetMapping("/category/{slug}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<SubcategoryDto>> byCategory(@PathVariable String slug) {
        List<SubcategoryDto> subs = subcategoryRepository.findByCategorySlugAndParentIsNullOrderBySortOrderAscNameAsc(slug)
            .stream().map(SubcategoryDto::from).toList();
        return ResponseEntity.ok(subs);
    }

    @GetMapping("/{id}/children")
    @Transactional(readOnly = true)
    public ResponseEntity<List<SubcategoryDto>> children(@PathVariable Long id) {
        List<SubcategoryDto> subs = subcategoryRepository.findByParentIdOrderBySortOrderAscNameAsc(id)
            .stream().map(SubcategoryDto::from).toList();
        return ResponseEntity.ok(subs);
    }
}
