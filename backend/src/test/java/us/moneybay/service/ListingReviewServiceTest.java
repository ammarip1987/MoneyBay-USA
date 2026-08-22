package us.moneybay.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import us.moneybay.model.Listing;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Пороги проверки объявления при публикации.
 *
 * Служба скрывает объявления через REJECTED, поэтому ошибка в её порогах тихо
 * уводит записи с сайта — без падения, без записи в журнале. Здесь закреплено,
 * где проходят границы.
 */
class ListingReviewServiceTest {

    private final ListingReviewService service = new ListingReviewService();

    /** Объявление, проходящее проверку целиком. */
    private Listing good() {
        Listing l = new Listing();
        l.setTitle("Honda Civic 2018, one owner");
        l.setDescription("Kept in a garage, full service history, new tyres last spring.");
        l.setPrice(12500.0);
        l.setLocation("Columbus, OH");
        l.setImages(List.of("front.webp", "interior.webp"));
        return l;
    }

    @Test
    @DisplayName("полное объявление замечаний не собирает")
    void completeListingPasses() {
        List<String> reasons = service.review(good());

        assertTrue(reasons.isEmpty(), "замечания на полном объявлении: " + reasons);
        assertFalse(service.shouldReject(reasons));
    }

    @Test
    @DisplayName("отсутствие цены отклоняет само по себе")
    void missingPriceAloneRejects() {
        Listing l = good();
        l.setPrice(null);

        List<String> reasons = service.review(l);

        assertTrue(reasons.contains("MISSING_PRICE"));
        // Одного этого хватает: объявление без цены ответов не получает
        assertTrue(service.shouldReject(reasons));
    }

    @Test
    @DisplayName("цена в ноль считается отсутствующей")
    void zeroPriceCountsAsMissing() {
        Listing l = good();
        l.setPrice(0.0);

        assertTrue(service.review(l).contains("MISSING_PRICE"));
    }

    @Test
    @DisplayName("один недочёт — совет, не отказ")
    void oneShortcomingIsAdviceNotRejection() {
        Listing l = good();
        l.setImages(List.of());

        List<String> reasons = service.review(l);

        assertEquals(List.of("MISSING_PHOTOS"), reasons);
        assertFalse(service.shouldReject(reasons), "одна мелочь не должна топить объявление");
    }

    @Test
    @DisplayName("два недочёта отклоняют")
    void twoShortcomingsReject() {
        Listing l = good();
        l.setImages(List.of());
        l.setDescription("used");

        List<String> reasons = service.review(l);

        assertEquals(2, reasons.size(), "ожидалось два замечания, пришло: " + reasons);
        assertTrue(service.shouldReject(reasons));
    }

    @Test
    @DisplayName("телефон в тексте отклоняет: переписка уходит со площадки")
    void phoneInTextRejects() {
        Listing l = good();
        l.setDescription("Kept in a garage, full history. Call me at 614-555-0142 any time.");

        List<String> reasons = service.review(l);

        assertTrue(reasons.contains("CONTACTS_IN_TEXT"));
        assertTrue(service.shouldReject(reasons));
    }

    @Test
    @DisplayName("почта в тексте отклоняет так же")
    void emailInTextRejects() {
        Listing l = good();
        l.setDescription("Kept in a garage, full history. Write to seller@example.com please.");

        assertTrue(service.review(l).contains("CONTACTS_IN_TEXT"));
    }

    @Test
    @DisplayName("заголовок заглавными читается как крик")
    void shoutingTitleIsFlagged() {
        Listing l = good();
        l.setTitle("HONDA CIVIC MUST GO TODAY");

        assertTrue(service.review(l).contains("SHOUTING_TITLE"));
    }

    @Test
    @DisplayName("граница длины заголовка")
    void titleLengthBoundary() {
        Listing shortTitle = good();
        shortTitle.setTitle("Honda Ci");          // 8 знаков — коротко
        assertTrue(service.review(shortTitle).contains("SHORT_TITLE"));

        Listing okTitle = good();
        okTitle.setTitle("Honda Civi");           // 10 знаков — проходит
        assertFalse(service.review(okTitle).contains("SHORT_TITLE"));
    }

    @Test
    @DisplayName("граница длины описания")
    void descriptionLengthBoundary() {
        Listing tooShort = good();
        tooShort.setDescription("x".repeat(39));
        assertTrue(service.review(tooShort).contains("SHORT_DESCRIPTION"));

        Listing enough = good();
        enough.setDescription("x".repeat(40));
        assertFalse(service.review(enough).contains("SHORT_DESCRIPTION"));
    }

    @Test
    @DisplayName("пустой город отмечается")
    void blankLocationIsFlagged() {
        Listing l = good();
        l.setLocation("   ");

        assertTrue(service.review(l).contains("MISSING_LOCATION"));
    }

    @Test
    @DisplayName("пустое объявление собирает несколько замечаний и отклоняется")
    void emptyListingCollectsSeveral() {
        List<String> reasons = service.review(new Listing());

        assertTrue(reasons.size() >= 4, "ожидалось несколько замечаний, пришло: " + reasons);
        assertTrue(service.shouldReject(reasons));
    }
}
