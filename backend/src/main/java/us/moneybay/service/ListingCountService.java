package us.moneybay.service;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Число объявлений для карусели страниц.
 *
 * Точный count(*) по 1.44 млн записей идёт пять секунд по всей ленте и двадцать
 * девять по одной категории — в ответ его не поставить, лента тогда отвечает
 * дольше, чем страница успевает нарисоваться.
 *
 * Поэтому числа считаются в стороне раз в час и держатся в памяти. Между
 * пересчётами они отстают на проценты — для номера последней страницы этого
 * достаточно.
 *
 * По всей ленте берётся оценка самой базы (reltuples из pg_class): она приходит
 * за 0.057 мс и на нынешних данных совпала с точным подсчётом до единицы.
 * По категориям такой оценки нет, там идёт обычный подсчёт — раз в час он
 * времени ответа не занимает.
 */
@Service
public class ListingCountService {

    private static final Logger log = LoggerFactory.getLogger(ListingCountService.class);

    @PersistenceContext
    private EntityManager em;

    /** Всего видимых объявлений. */
    private volatile long total = 0;

    /** По слагу категории. Читается из потоков запросов, пишется из пересчёта. */
    private final Map<String, Long> byCategory = new ConcurrentHashMap<>();

    @PostConstruct
    public void warmUp() {
        // Первый пересчёт при старте: без него карусель до первого часа
        // осталась бы без последней страницы
        try {
            refresh();
        } catch (Exception e) {
            log.warn("Первый подсчёт объявлений не удался: {}", e.getMessage());
        }
    }

    @Scheduled(fixedRate = 3600_000)
    @Transactional(readOnly = true)
    public void refresh() {
        long started = System.currentTimeMillis();

        // Подсчёт точный, а не оценка из pg_class: та берётся из служебных
        // данных и после крупного удаления завышает — удалённые строки остаются
        // в счёте, пока их не уберёт уборка. После снятия 202939 объявлений
        // оценка показывала 1873129 при 1237065 действительных.
        //
        // Пять секунд здесь не в тягость: раз в час, в стороне от запросов.
        Object exact = em.createNativeQuery(
                "SELECT count(*) FROM listings WHERE is_active AND NOT is_deleted")
            .getSingleResult();
        total = exact == null ? 0 : ((Number) exact).longValue();

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(
                "SELECT c.slug, count(*) FROM listings l " +
                "JOIN categories c ON c.id = l.category_id " +
                "WHERE l.is_active AND NOT l.is_deleted " +
                "GROUP BY c.slug")
            .getResultList();

        Map<String, Long> fresh = new HashMap<>();
        for (Object[] row : rows) {
            fresh.put((String) row[0], ((Number) row[1]).longValue());
        }
        byCategory.keySet().retainAll(fresh.keySet());
        byCategory.putAll(fresh);

        log.info("Подсчёт объявлений обновлён за {} мс: всего {}, категорий {}",
            System.currentTimeMillis() - started, total, fresh.size());
    }

    /**
     * Сколько объявлений в этом срезе. Отбор по городу здесь не учитывается —
     * держать числа по каждой паре «город + категория» дороже, чем стоит номер
     * последней страницы.
     */
    public long count(String categorySlug) {
        if (categorySlug == null || categorySlug.isBlank()) return total;
        return byCategory.getOrDefault(categorySlug, 0L);
    }

    /** Номер последней страницы при заданном размере. */
    public int lastPage(String categorySlug, int pageSize) {
        long n = count(categorySlug);
        if (n <= 0) return 1;
        return (int) Math.max(1, (n + pageSize - 1) / pageSize);
    }
}
