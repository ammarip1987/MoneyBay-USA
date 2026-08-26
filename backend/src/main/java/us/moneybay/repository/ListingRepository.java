package us.moneybay.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import us.moneybay.model.Listing;
import java.util.List;
import java.util.Optional;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    /** Перенос объявлений между категориями: применяется при упразднении Housing. */
    @Modifying
    @Transactional
    @Query("UPDATE Listing l SET l.category.id = :toId WHERE l.category.id = :fromId")
    int moveToCategory(@Param("fromId") Long fromId, @Param("toId") Long toId);

    /**
     * Объявление вместе с продавцом: подпись «More from …» берёт его имя, а
     * связь у Listing отложенная — без JOIN FETCH обращение к имени вне сессии
     * роняет ответ.
     */
    @Query("SELECT l FROM Listing l LEFT JOIN FETCH l.user WHERE l.id = :id")
    Optional<Listing> findByIdWithUser(@Param("id") Long id);

    Page<Listing> findByIsActiveTrueAndIsDeletedFalse(Pageable pageable);

    long countByIsTestTrue();

    long countByIsActiveTrueAndIsDeletedFalse();

    @Modifying
    @Transactional
    @Query("DELETE FROM Listing l WHERE l.isTest = true")
    int deleteAllByIsTestTrue();

    /**
     * Фотографии тестовых объявлений. Вызывается перед удалением самих
     * объявлений: внешний ключ listing_images задан без ON DELETE CASCADE.
     */
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM listing_images WHERE listing_id IN " +
                   "(SELECT id FROM listings WHERE is_test = true)", nativeQuery = true)
    int deleteImagesOfTestListings();

    List<Listing> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(Long userId);

    List<Listing> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Видимые объявления продавца для открытого профиля, с пределом. */
    @Query("SELECT l FROM Listing l WHERE l.user.id = :userId " +
           "AND l.isActive = true AND l.isDeleted = false ORDER BY l.createdAt DESC")
    List<Listing> findActiveByUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT COUNT(l) FROM Listing l WHERE l.user.id = :userId " +
           "AND l.isActive = true AND l.isDeleted = false")
    long countActiveByUser(@Param("userId") Long userId);

    @Query("SELECT l FROM Listing l WHERE l.isActive = true AND l.isDeleted = false " +
           "AND (COALESCE(:q, '') = '' OR LOWER(l.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(l.description) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "AND (COALESCE(:city, '') = '' OR l.location = :city) " +
           "AND (COALESCE(:categorySlug, '') = '' OR l.category.slug = :categorySlug)")
    Page<Listing> search(@Param("q") String q,
                         @Param("city") String city,
                         @Param("categorySlug") String categorySlug,
                         Pageable pageable);

    /**
     * Та же выборка, но списком: Page вынуждает считать все строки, а count по
     * миллионам записей читает таблицу целиком. Здесь запрашивается на одну
     * запись больше, чем нужно, — по её наличию видно, есть ли следующая
     * страница, и подсчёт становится лишним.
     *
     * Продвижение здесь не учитывается: сортировка по вычисляемому CASE не
     * ложится на индекс, и база перебирала сотни тысяч строк — лента отвечала
     * шесть секунд. Продвинутые запрашиваются отдельно (findPromoted) и
     * ставятся впереди уже в контроллере: их единицы.
     */
    // JPQL, а не запрос к базе напрямую: Pageable несёт выбранную сортировку, а
    // для родного запроса Spring её не подставляет — лента отвечала пятисоткой.
    //
    // Отбор по штату идёт через SUBSTRING по концу строки. Индекс
    // idx_listings_state построен на right(location, 2), и PostgreSQL сводит к
    // нему это выражение сам.
    @Query("SELECT l FROM Listing l WHERE l.isActive = true AND l.isDeleted = false " +
           "AND (COALESCE(:city, '') = '' OR l.location = :city) " +
           "AND (COALESCE(:state, '') = '' OR SUBSTRING(l.location, LENGTH(l.location) - 1, 2) = :state) " +
           "AND (COALESCE(:categorySlug, '') = '' OR l.category.slug = :categorySlug)")
    List<Listing> searchSlice(@Param("city") String city,
                              @Param("state") String state,
                              @Param("categorySlug") String categorySlug,
                              Pageable pageable);

    /**
     * Поиск по словам.
     *
     * Запрос к базе напрямую: JPQL полнотекстового поиска не знает, а он здесь
     * необходим — отбор LIKE '%слово%' индекс не берёт, и на 1.2 млн записей
     * поиск по «house» не отвечал дольше десяти минут.
     *
     * plainto_tsquery разбирает введённое как обычный текст: знаки препинания и
     * лишние пробелы не роняют запрос, что было бы с to_tsquery.
     *
     * Сортировка по свежести, а не по совпадению: на площадке объявлений свежее
     * важнее похожего, и упорядочивание по ts_rank потребовало бы вычислять
     * оценку для каждой найденной строки.
     */
    @Query(value = "SELECT l.* FROM listings l " +
                   "LEFT JOIN categories c ON c.id = l.category_id " +
                   "WHERE l.is_active AND NOT l.is_deleted " +
                   "AND to_tsvector('english', coalesce(l.title, '') || ' ' || coalesce(l.description, '')) " +
                   "    @@ plainto_tsquery('english', :q) " +
                   "AND (COALESCE(:city, '') = '' OR l.location = :city) " +
                   "AND (COALESCE(:state, '') = '' OR right(l.location, 2) = :state) " +
                   "AND (COALESCE(:categorySlug, '') = '' OR c.slug = :categorySlug) " +
                   "ORDER BY l.created_at DESC LIMIT :limit OFFSET :offset",
           nativeQuery = true)
    List<Listing> searchByText(@Param("q") String q,
                               @Param("city") String city,
                               @Param("state") String state,
                               @Param("categorySlug") String categorySlug,
                               @Param("limit") int limit,
                               @Param("offset") int offset);

    /** Объявления с действующим продвижением — их немного, отбор дешёвый. */
    @Query("SELECT l FROM Listing l WHERE l.isActive = true AND l.isDeleted = false " +
           "AND l.promotedUntil > CURRENT_TIMESTAMP " +
           "AND (COALESCE(:city, '') = '' OR l.location = :city) " +
           "AND (COALESCE(:categorySlug, '') = '' OR l.category.slug = :categorySlug) " +
           "ORDER BY l.promotedUntil DESC")
    List<Listing> findPromoted(@Param("city") String city,
                               @Param("categorySlug") String categorySlug,
                               Pageable pageable);

    /**
     * Расширенные фильтры: цена, наличие снимков, давность.
     *
     * Запрос к базе напрямую — слово поиска сверяется полнотекстовым индексом.
     * Прежде здесь стоял LIKE '%слово%', который индекс не берёт: с заданным
     * словом запрос читал таблицу целиком и не отвечал.
     */
    @Query(value = "SELECT l.* FROM listings l " +
                   "LEFT JOIN categories c ON c.id = l.category_id " +
                   "WHERE l.is_active AND NOT l.is_deleted " +
                   "AND (COALESCE(:q, '') = '' OR " +
                   "     to_tsvector('english', coalesce(l.title, '') || ' ' || coalesce(l.description, '')) " +
                   "     @@ plainto_tsquery('english', :q)) " +
                   "AND (COALESCE(:city, '') = '' OR l.location = :city) " +
                   "AND (COALESCE(:categorySlug, '') = '' OR c.slug = :categorySlug) " +
                   "AND (CAST(:priceMin AS double precision) IS NULL OR l.price >= :priceMin) " +
                   "AND (CAST(:priceMax AS double precision) IS NULL OR l.price <= :priceMax) " +
                   // Соединение с таблицей снимков, а не условие через параметр:
                   // при «:hasImage = false OR …» планировщик строит план, не
                   // зная значения, ожидает половину таблицы и перебирает
                   // миллион строк. Здесь отбор всегда начинается с малой
                   // таблицы, а без надобности запрос сюда просто не заходит —
                   // контроллер выбирает searchSlice
                   "AND l.id IN (SELECT i.listing_id FROM listing_images i) " +
                   "AND (CAST(:postedAfter AS timestamptz) IS NULL OR l.created_at >= :postedAfter) " +
                   // Сортировка только по дате: вычисляемое выражение
                   // (promoted_until > now()) индекс не берёт, и база сортировала
                   // весь отбор целиком. Продвинутые ставятся вперёд в
                   // контроллере отдельным запросом — их единицы
                   "ORDER BY l.created_at DESC " +
                   "LIMIT :limit OFFSET :offset",
           nativeQuery = true)
    List<Listing> searchAdvanced(@Param("q") String q,
                                 @Param("city") String city,
                                 @Param("categorySlug") String categorySlug,
                                 @Param("priceMin") Double priceMin,
                                 @Param("priceMax") Double priceMax,
                                 @Param("postedAfter") java.time.Instant postedAfter,
                                 @Param("limit") int limit,
                                 @Param("offset") int offset);

    /**
     * То же, но без отбора по снимкам.
     *
     * Два запроса вместо одного с условием «:hasImage = false OR …»: с
     * параметром планировщик строит план, не зная значения, и на «true»
     * перебирал миллион строк вместо четырёх подходящих.
     */
    @Query(value = "SELECT l.* FROM listings l " +
                   "LEFT JOIN categories c ON c.id = l.category_id " +
                   "WHERE l.is_active AND NOT l.is_deleted " +
                   "AND (COALESCE(:q, '') = '' OR " +
                   "     to_tsvector('english', coalesce(l.title, '') || ' ' || coalesce(l.description, '')) " +
                   "     @@ plainto_tsquery('english', :q)) " +
                   "AND (COALESCE(:city, '') = '' OR l.location = :city) " +
                   "AND (COALESCE(:categorySlug, '') = '' OR c.slug = :categorySlug) " +
                   "AND (CAST(:priceMin AS double precision) IS NULL OR l.price >= :priceMin) " +
                   "AND (CAST(:priceMax AS double precision) IS NULL OR l.price <= :priceMax) " +
                   "AND (CAST(:postedAfter AS timestamptz) IS NULL OR l.created_at >= :postedAfter) " +
                   "ORDER BY l.created_at DESC " +
                   "LIMIT :limit OFFSET :offset",
           nativeQuery = true)
    List<Listing> searchAdvancedAnyImage(@Param("q") String q,
                                         @Param("city") String city,
                                         @Param("categorySlug") String categorySlug,
                                         @Param("priceMin") Double priceMin,
                                         @Param("priceMax") Double priceMax,
                                         @Param("postedAfter") java.time.Instant postedAfter,
                                         @Param("limit") int limit,
                                         @Param("offset") int offset);


    @Query("SELECT l.price FROM Listing l WHERE l.isActive = true AND l.isDeleted = false " +
           "AND (COALESCE(:city, '') = '' OR l.location = :city) " +
           "AND (COALESCE(:categorySlug, '') = '' OR l.category.slug = :categorySlug) " +
           "ORDER BY l.price ASC")
    List<Double> pricesForCategory(@Param("city") String city, @Param("categorySlug") String categorySlug);

    /**
     * Границы и среднее одним запросом: возвращает count, min, max, avg.
     *
     * Прежде для этого выбирались все цены и считались в приложении — на
     * категории со 144 тысячами объявлений ответ шёл больше двух секунд, почти
     * всё уходило на пересылку и разбор списка.
     */
    @Query(value = "SELECT count(*), min(l.price), max(l.price), avg(l.price) " +
                   "FROM listings l LEFT JOIN categories c ON c.id = l.category_id " +
                   "WHERE l.is_active AND NOT l.is_deleted " +
                   "AND (COALESCE(:city, '') = '' OR l.location = :city) " +
                   "AND (COALESCE(:categorySlug, '') = '' OR c.slug = :categorySlug)",
           nativeQuery = true)
    Object[] priceStats(@Param("city") String city, @Param("categorySlug") String categorySlug);

    /**
     * Распределение цен по промежуткам средствами базы: width_bucket раскладывает
     * строки, не вынимая их наружу.
     */
    @Query(value = "SELECT width_bucket(l.price, :priceMin, :priceMax, :buckets) AS bucket, count(*) " +
                   "FROM listings l LEFT JOIN categories c ON c.id = l.category_id " +
                   "WHERE l.is_active AND NOT l.is_deleted " +
                   "AND (COALESCE(:city, '') = '' OR l.location = :city) " +
                   "AND (COALESCE(:categorySlug, '') = '' OR c.slug = :categorySlug) " +
                   "GROUP BY bucket ORDER BY bucket",
           nativeQuery = true)
    List<Object[]> priceBuckets(@Param("city") String city,
                                @Param("categorySlug") String categorySlug,
                                @Param("priceMin") double priceMin,
                                @Param("priceMax") double priceMax,
                                @Param("buckets") int buckets);

    @Query("SELECT l FROM Listing l WHERE l.isActive = true AND l.isDeleted = false " +
           "AND LOWER(l.title) LIKE LOWER(CONCAT(:q, '%')) " +
           "AND (:city IS NULL OR l.location = :city) " +
           "ORDER BY l.createdAt DESC")
    List<Listing> suggestByTitlePrefix(@Param("q") String q,
                                       @Param("city") String city,
                                       Pageable pageable);

    /**
     * Подсказки по словам заголовка и описания.
     *
     * Прежде здесь стоял LIKE '%слово%' по заголовку — он индекс не берёт, и
     * подсказки не отвечали дольше тридцати секунд. Полнотекстовый индекс тот
     * же, что у поиска.
     */
    @Query(value = "SELECT l.* FROM listings l " +
                   "WHERE l.is_active AND NOT l.is_deleted " +
                   "AND to_tsvector('english', coalesce(l.title, '') || ' ' || coalesce(l.description, '')) " +
                   "    @@ plainto_tsquery('english', :q) " +
                   "AND (:city IS NULL OR l.location = :city) " +
                   "ORDER BY l.created_at DESC LIMIT :limit",
           nativeQuery = true)
    List<Listing> suggestByTitleContains(@Param("q") String q,
                                         @Param("city") String city,
                                         @Param("limit") int limit);

    @Query("SELECT l FROM Listing l WHERE l.isActive = true AND l.isDeleted = false " +
           "AND l.id <> :excludeId " +
           "AND (:categoryId IS NULL OR l.category.id = :categoryId) " +
           "AND l.location = :location " +
           // Предел как у соседних запросов: без него отдавались все объявления
           // города — на большой категории это тысячи строк и пять секунд ответа
           "ORDER BY l.createdAt DESC LIMIT 12")
    List<Listing> findRelatedSameLocation(@Param("excludeId") Long excludeId,
                                          @Param("categoryId") Long categoryId,
                                          @Param("location") String location);

    // Та же категория, но без привязки к городу: показывает, что есть в разделе
    // по всей площадке. Соседний findRelatedSameLocation ограничен одним городом
    @Query("SELECT l FROM Listing l WHERE l.isActive = true AND l.isDeleted = false " +
           "AND l.id <> :excludeId " +
           "AND (:categoryId IS NULL OR l.category.id = :categoryId) " +
           "AND (:location IS NULL OR l.location <> :location) " +
           "ORDER BY l.createdAt DESC LIMIT 12")
    List<Listing> findRelatedAnywhere(@Param("excludeId") Long excludeId,
                                      @Param("categoryId") Long categoryId,
                                      @Param("location") String location);

    @Query("SELECT l FROM Listing l WHERE l.isActive = true AND l.isDeleted = false " +
           "AND l.id <> :excludeId " +
           "AND (:categoryId IS NULL OR l.category.id = :categoryId) " +
           "AND l.price >= :priceMin AND l.price <= :priceMax " +
           "ORDER BY l.createdAt DESC LIMIT 12")
    List<Listing> findRelatedSimilarPrice(@Param("excludeId") Long excludeId,
                                          @Param("categoryId") Long categoryId,
                                          @Param("priceMin") Double priceMin,
                                          @Param("priceMax") Double priceMax);

    // Отбора по категории здесь нет: «ещё от этого продавца» показывает всё, что
    // у него есть. С отбором подборка пустела, когда объявления продавца из
    // разных разделов, и вместе с ней пропадала кнопка See all.
    @Query("SELECT l FROM Listing l WHERE l.isActive = true AND l.isDeleted = false " +
           "AND l.id <> :excludeId " +
           "AND (:userId IS NULL OR l.user.id = :userId) " +
           "ORDER BY l.createdAt DESC LIMIT 12")
    List<Listing> findRelatedFromSeller(@Param("excludeId") Long excludeId,
                                        @Param("categoryId") Long categoryId,
                                        @Param("userId") Long userId);
}
