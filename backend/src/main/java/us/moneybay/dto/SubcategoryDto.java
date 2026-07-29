package us.moneybay.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import us.moneybay.model.Subcategory;

@Data
@NoArgsConstructor
public class SubcategoryDto {
    private Long id;
    private String slug;
    private String name;
    private String description;
    private String icon;
    private String color;
    private Long categoryId;
    private String categorySlug;
    private Long parentId;
    private String parentSlug;

    public static SubcategoryDto from(Subcategory sub) {
        SubcategoryDto dto = new SubcategoryDto();
        dto.id = sub.getId();
        dto.slug = sub.getSlug();
        dto.name = sub.getName();
        dto.description = sub.getDescription();
        dto.icon = sub.getIcon();
        dto.color = sub.getColor();
        if (sub.getCategory() != null) {
            dto.categoryId = sub.getCategory().getId();
            dto.categorySlug = sub.getCategory().getSlug();
        }
        if (sub.getParent() != null) {
            dto.parentId = sub.getParent().getId();
            dto.parentSlug = sub.getParent().getSlug();
        }
        return dto;
    }
}
