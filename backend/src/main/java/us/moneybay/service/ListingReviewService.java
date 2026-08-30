package us.moneybay.service;

import org.springframework.stereotype.Service;
import us.moneybay.model.Listing;

import java.util.ArrayList;
import java.util.List;

/**
 * Проверка объявления при публикации.
 *
 * Возвращает причины, по которым объявление стоит доработать. Они складываются
 * в поле moderationReasons и показываются автору окном: что поправить, чтобы
 * объявление показывалось покупателям.
 *
 * Отклонение не удаляет объявление — оно остаётся у автора, и после правки
 * проверка проходит заново.
 */
@Service
public class ListingReviewService {

    /** Причин достаточно для отклонения. Одна мелочь объявление не топит. */
    private static final int REJECT_THRESHOLD = 2;

    private static final int MIN_DESCRIPTION = 40;
    private static final int MIN_TITLE = 10;
    private static final double MIN_PRICE = 1.0;

    public List<String> review(Listing listing) {
        List<String> reasons = new ArrayList<>();


        String title = listing.getTitle() == null ? "" : listing.getTitle().trim();
        if (title.length() < MIN_TITLE) {
            reasons.add("SHORT_TITLE");
        }
        // Заголовок целиком заглавными читается как крик и тянет внимание
        if (title.length() > 6 && title.equals(title.toUpperCase()) && title.matches(".*[A-Z].*")) {
            reasons.add("SHOUTING_TITLE");
        }

        String description = listing.getDescription() == null ? "" : listing.getDescription().trim();
        if (description.length() < MIN_DESCRIPTION) {
            reasons.add("SHORT_DESCRIPTION");
        }

        // Цена от доллара: ниже — способ попасть наверх выдачи дешёвым товаром,
        // которого нет
        if (listing.getPrice() == null || listing.getPrice() < MIN_PRICE) {
            reasons.add("MISSING_PRICE");
        }

        if (listing.getLocation() == null || listing.getLocation().isBlank()) {
            reasons.add("MISSING_LOCATION");
        }

        // Способ связи в тексте: покупатели должны писать через площадку, иначе
        // переписка уходит в сторону и спорить потом не с чем
        if (description.matches(".*\\b\\d{3}[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b.*")
                || description.matches(".*[\\w.]+@[\\w.]+\\.\\w+.*")) {
            reasons.add("CONTACTS_IN_TEXT");
        }

        return reasons;
    }

    /** Отклонять ли объявление или показать замечания как совет. */
    public boolean shouldReject(List<String> reasons) {
        return reasons.size() >= REJECT_THRESHOLD
            || reasons.contains("MISSING_PRICE")
            || reasons.contains("CONTACTS_IN_TEXT");
    }
}
