package us.moneybay.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import us.moneybay.model.Listing;
import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
public class ListingDto {
    private Long id;
    private String title;
    private String description;
    private Double price;
    private String location;
    private String area;
    private List<String> images;
    private Integer views;
    @JsonProperty("is_active")
    private boolean isActive;
    @JsonProperty("is_featured")
    private boolean isFeatured;
    @JsonProperty("promoted_until")
    private Instant promotedUntil;
    @JsonProperty("user_id")
    private Long userId;
    @JsonProperty("category_id")
    private Long categoryId;
    @JsonProperty("created_at")
    private Instant createdAt;
    /** Имя продавца для подписи «More from …»: почта наружу не идёт. */
    @JsonProperty("user_name")
    private String userName;

    public static ListingDto from(Listing listing) {
        ListingDto dto = new ListingDto();
        dto.id = listing.getId();
        dto.title = listing.getTitle();
        dto.description = listing.getDescription();
        dto.price = listing.getPrice();
        dto.location = listing.getLocation();
        dto.area = listing.getArea();
        dto.images = listing.getImages();
        dto.views = listing.getViews();
        dto.isActive = listing.isActive();
        dto.isFeatured = listing.isFeatured();
        dto.promotedUntil = listing.getPromotedUntil();
        dto.userId = listing.getUser() != null ? listing.getUser().getId() : null;
        dto.categoryId = listing.getCategory() != null ? listing.getCategory().getId() : null;
        dto.createdAt = listing.getCreatedAt();
        dto.userName = listing.getUser() != null ? listing.getUser().getUsername() : null;
        return dto;
    }
}
