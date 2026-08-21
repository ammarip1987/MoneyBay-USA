package us.moneybay.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import us.moneybay.model.Storefront;

/**
 * Витрина для клиента. Правовые сведения сюда не попадают: они у Stripe, и
 * площадка их не хранит.
 */
@Getter
@Setter
@NoArgsConstructor
public class StorefrontDto {
    private Long id;
    private String name;
    private String slug;
    private String about;
    private String logoUrl;
    private String bannerUrl;
    private String location;
    private String phones;
    private String website;
    private String hours;
    private boolean published;

    /** Состояние проверки: витрина показывает его владельцу. */
    private String verificationStatus;
    private boolean payoutsEnabled;

    public static StorefrontDto from(Storefront s) {
        StorefrontDto dto = new StorefrontDto();
        dto.id = s.getId();
        dto.name = s.getName();
        dto.slug = s.getSlug();
        dto.about = s.getAbout();
        dto.logoUrl = s.getLogoUrl();
        dto.bannerUrl = s.getBannerUrl();
        dto.location = s.getLocation();
        dto.phones = s.getPhones();
        dto.website = s.getWebsite();
        dto.hours = s.getHours();
        dto.published = s.isPublished();
        dto.verificationStatus = s.getVerificationStatus().name();
        dto.payoutsEnabled = s.isPayoutsEnabled();
        return dto;
    }
}
