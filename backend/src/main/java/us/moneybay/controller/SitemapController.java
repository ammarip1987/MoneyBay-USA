package us.moneybay.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import us.moneybay.model.Category;
import us.moneybay.model.City;
import us.moneybay.model.Listing;
import us.moneybay.model.Subcategory;
import us.moneybay.repository.CategoryRepository;
import us.moneybay.repository.CityRepository;
import us.moneybay.repository.ListingRepository;
import us.moneybay.repository.SubcategoryRepository;
import java.time.LocalDate;
import java.time.ZoneId;

@RestController
public class SitemapController {

    @Value("${app.frontend.url:http://localhost:1100}")
    private String baseUrl;

    private final CategoryRepository categoryRepository;
    private final ListingRepository listingRepository;
    private final SubcategoryRepository subcategoryRepository;
    private final CityRepository cityRepository;

    public SitemapController(CategoryRepository categoryRepository,
                             ListingRepository listingRepository,
                             SubcategoryRepository subcategoryRepository,
                             CityRepository cityRepository) {
        this.categoryRepository = categoryRepository;
        this.listingRepository = listingRepository;
        this.subcategoryRepository = subcategoryRepository;
        this.cityRepository = cityRepository;
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap() {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" ")
           .append("xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">\n");

        String today = LocalDate.now(ZoneId.of("UTC")).toString();

        // Static pages
        String[] staticUrls = {"/", "/login", "/register", "/about", "/privacy", "/terms", "/contact", "/refund"};
        for (String url : staticUrls) {
            xml.append("  <url><loc>").append(escape(baseUrl + url)).append("</loc>")
               .append("<lastmod>").append(today).append("</lastmod>")
               .append("<changefreq>weekly</changefreq><priority>0.8</priority></url>\n");
        }

        // Categories
        for (Category cat : categoryRepository.findAll()) {
            xml.append("  <url><loc>").append(escape(baseUrl + "/?category=" + cat.getSlug())).append("</loc>")
               .append("<lastmod>").append(today).append("</lastmod>")
               .append("<changefreq>daily</changefreq><priority>0.7</priority></url>\n");
        }

        // Subcategories and sub-subcategories
        for (Subcategory sub : subcategoryRepository.findAll()) {
            String categorySlug = sub.getCategory() != null ? sub.getCategory().getSlug() : null;
            if (categorySlug == null) continue;
            String url = sub.getParent() != null
                ? baseUrl + "/?category=" + categorySlug + "&sub=" + sub.getParent().getSlug() + "&subsub=" + sub.getSlug()
                : baseUrl + "/?category=" + categorySlug + "&sub=" + sub.getSlug();
            xml.append("  <url><loc>").append(escape(url)).append("</loc>")
               .append("<lastmod>").append(today).append("</lastmod>")
               .append("<changefreq>daily</changefreq><priority>0.6</priority></url>\n");
        }

        // City subdomains (Craigslist-style)
        for (City city : cityRepository.findAll()) {
            if (city.getSubdomain() == null || city.getSubdomain().isBlank()) continue;
            String cityHost = baseUrl.replace("://", "://" + city.getSubdomain() + ".");
            xml.append("  <url><loc>").append(escape(cityHost)).append("/</loc>")
               .append("<lastmod>").append(today).append("</lastmod>")
               .append("<changefreq>daily</changefreq><priority>0.7</priority></url>\n");
        }

        // Active listings (with image)
        for (Listing listing : listingRepository.findAll()) {
            if (!listing.isActive()) continue;
            String lastmod = listing.getCreatedAt() != null
                ? listing.getCreatedAt().atZone(ZoneId.of("UTC")).toLocalDate().toString()
                : today;
            xml.append("  <url><loc>").append(escape(baseUrl + "/listing/" + listing.getId())).append("</loc>")
               .append("<lastmod>").append(lastmod).append("</lastmod>")
               .append("<changefreq>weekly</changefreq><priority>0.6</priority>");

            if (listing.getImages() != null && !listing.getImages().isEmpty()) {
                String img = listing.getImages().get(0);
                xml.append("<image:image><image:loc>")
                   .append(escape(baseUrl + "/api/uploads/" + img))
                   .append("</image:loc></image:image>");
            }
            xml.append("</url>\n");
        }

        xml.append("</urlset>");
        return ResponseEntity.ok(xml.toString());
    }

    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> robots() {
        String content = """
            User-agent: *
            Allow: /
            Disallow: /api/
            Disallow: /admin/
            Disallow: /profile
            Disallow: /edit-profile
            Disallow: /my-listings
            Disallow: /new-listing
            Disallow: /edit-listing/
            Disallow: /messages
            Disallow: /chat/
            Disallow: /favorites
            Disallow: /promote/
            Disallow: /login
            Disallow: /register
            Disallow: /forgot-password
            Disallow: /reset-password
            Disallow: /verify-email

            User-agent: GPTBot
            Disallow: /

            User-agent: CCBot
            Disallow: /

            Sitemap: %s/sitemap.xml
            """.formatted(baseUrl);
        return ResponseEntity.ok(content);
    }

    private String escape(String url) {
        return url.replace("&", "&amp;")
                  .replace("<", "&lt;")
                  .replace(">", "&gt;")
                  .replace("\"", "&quot;")
                  .replace("'", "&apos;");
    }
}
