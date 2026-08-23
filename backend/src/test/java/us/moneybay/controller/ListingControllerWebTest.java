package us.moneybay.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import us.moneybay.model.Category;
import us.moneybay.model.Listing;
import us.moneybay.model.User;
import us.moneybay.repository.CategoryRepository;
import us.moneybay.repository.CityRepository;
import us.moneybay.repository.ListingRepository;
import us.moneybay.repository.UserRepository;
import us.moneybay.security.JwtUtil;
import us.moneybay.service.KeywordFilterService;
import us.moneybay.service.ListingCountService;
import us.moneybay.service.ListingReviewService;
import us.moneybay.service.R2PhotoService;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Ответ ленты и одного объявления через настоящий стек Spring MVC.
 *
 * Уровнем ниже (ListingDtoTest) проверяется, что DTO собирает верный JSON.
 * Здесь — что этот JSON доходит до клиента таким же: отрисовку выполняет
 * ObjectMapper, настроенный самим Spring Boot, а не собранный в тесте.
 * Дефект с created_at жил ровно на этом рубеже.
 *
 * База не поднимается: репозитории подменены, запросы к ним не уходят.
 */
@WebMvcTest(controllers = ListingController.class,
            excludeAutoConfiguration = {
                org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class
            })
@AutoConfigureMockMvc(addFilters = false)
class ListingControllerWebTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean private ListingRepository listingRepository;
    @MockitoBean private CategoryRepository categoryRepository;
    @MockitoBean private CityRepository cityRepository;
    @MockitoBean private R2PhotoService r2PhotoService;
    @MockitoBean private KeywordFilterService keywordFilterService;
    @MockitoBean private ListingReviewService listingReviewService;
    @MockitoBean private ListingCountService listingCountService;
    // Фильтр разбора токена поднимается вместе с контекстом, хотя запросы здесь
    // идут без входа. Подменяется, чтобы не тянуть за собой security целиком.
    @MockitoBean private JwtUtil jwtUtil;
    @MockitoBean private UserRepository userRepository;

    private Listing sample() {
        Listing l = new Listing();
        l.setId(1229780L);
        l.setTitle("Electronics item #1932908");
        l.setDescription("Gently used, no visible wear.");
        l.setPrice(3673.21);
        l.setLocation("South Portland, ME");
        l.setImages(List.of("photo.webp"));
        l.setViews(255);
        l.setActive(true);
        l.setCreatedAt(Instant.parse("2026-08-20T23:30:32Z"));
        l.setStatus(Listing.ListingStatus.ACTIVE);

        // Продавец и категория заданы: DTO кладёт наружу их номера, и фронт
        // читает user_id с category_id. Без них Jackson опускает поля целиком
        User seller = new User();
        seller.setId(20068L);
        l.setUser(seller);

        Category category = new Category();
        category.setId(6L);
        l.setCategory(category);

        return l;
    }

    @Test
    @DisplayName("лента отдаёт объявления с датой в created_at")
    void feedCarriesTheDate() throws Exception {
        when(listingRepository.searchSlice(any(), any(), any(Pageable.class)))
            .thenReturn(List.of(sample()));
        when(listingRepository.findPromoted(any(), any(), any(Pageable.class)))
            .thenReturn(List.of());

        mvc.perform(get("/api/listings").param("page", "1"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.listings").isArray())
           .andExpect(jsonPath("$.listings[0].id").value(1229780))
           // Строкой ISO, а не числом и не статусом: фронт разбирает это как дату
           .andExpect(jsonPath("$.listings[0].created_at").value("2026-08-20T23:30:32Z"))
           .andExpect(jsonPath("$.listings[0].price").value(3673.21))
           .andExpect(jsonPath("$.listings[0].images").isArray());
    }

    @Test
    @DisplayName("последняя страница считается по числу объявлений")
    void lastPageComesFromTheCount() throws Exception {
        when(listingRepository.searchSlice(any(), any(), any(Pageable.class)))
            .thenReturn(List.of(sample()));
        when(listingRepository.findPromoted(any(), any(), any(Pageable.class)))
            .thenReturn(List.of());
        when(listingCountService.count(any())).thenReturn(1440004L);
        when(listingCountService.lastPage(any(), anyInt())).thenReturn(24001);

        // Прежде здесь стояло page + 1, и карусель запиралась на четвёртой
        // странице, хотя объявления шли дальше
        mvc.perform(get("/api/listings").param("page", "3"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.total_pages").value(24001))
           .andExpect(jsonPath("$.total").value(1440004));
    }

    @Test
    @DisplayName("ответ ленты несёт признак следующей страницы")
    void feedReportsWhetherMorePagesFollow() throws Exception {
        when(listingRepository.searchSlice(any(), any(), any(Pageable.class)))
            .thenReturn(List.of(sample()));
        when(listingRepository.findPromoted(any(), any(), any(Pageable.class)))
            .thenReturn(List.of());

        mvc.perform(get("/api/listings").param("page", "1"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.has_next").exists());
    }

    @Test
    @DisplayName("продвинутое объявление идёт первым на первой странице")
    void promotedComesFirst() throws Exception {
        Listing plain = sample();

        Listing boosted = sample();
        boosted.setId(8L);
        boosted.setTitle("Boosted one");
        boosted.setPromotedUntil(Instant.parse("2027-01-01T00:00:00Z"));

        when(listingRepository.searchSlice(any(), any(), any(Pageable.class)))
            .thenReturn(List.of(plain));
        when(listingRepository.findPromoted(any(), any(), any(Pageable.class)))
            .thenReturn(List.of(boosted));

        mvc.perform(get("/api/listings").param("page", "1"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.listings[0].id").value(8))
           .andExpect(jsonPath("$.listings[0].promoted_until").exists());
    }

    @Test
    @DisplayName("одно объявление отдаётся с теми же именами полей")
    void singleListingKeepsFieldNames() throws Exception {
        when(listingRepository.findByIdWithUser(1229780L)).thenReturn(Optional.of(sample()));

        mvc.perform(get("/api/listings/1229780"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.created_at").value("2026-08-20T23:30:32Z"))
           .andExpect(jsonPath("$.is_active").isBoolean())
           .andExpect(jsonPath("$.user_id").value(20068))
           .andExpect(jsonPath("$.category_id").value(6));
    }

    @Test
    @DisplayName("объявление без цены и города не роняет подборки")
    void similarSurvivesMissingPriceAndLocation() throws Exception {
        Listing bare = new Listing();
        bare.setId(677735L);
        bare.setTitle("no price, no city");

        when(listingRepository.findById(677735L)).thenReturn(Optional.of(bare));
        when(listingRepository.findRelatedAnywhere(any(), any(), any())).thenReturn(List.of());
        when(listingRepository.findRelatedFromSeller(any(), any(), any())).thenReturn(List.of());

        // Прежде здесь умножалось price * 0.8 и весь ответ падал пятисоткой
        mvc.perform(get("/api/listings/677735/similar"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.same_location").isArray())
           .andExpect(jsonPath("$.similar_price").isArray());
    }

    @Test
    @DisplayName("несуществующее объявление отвечает 404, а не пятисоткой")
    void missingListingIsNotFound() throws Exception {
        when(listingRepository.findByIdWithUser(999999L)).thenReturn(Optional.empty());

        mvc.perform(get("/api/listings/999999"))
           .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("подборки внутри объявления приходят четырьмя списками")
    void similarComesAsFourLists() throws Exception {
        when(listingRepository.findById(1229780L)).thenReturn(Optional.of(sample()));
        when(listingRepository.findRelatedSameLocation(any(), any(), any()))
            .thenReturn(List.of(sample()));
        when(listingRepository.findRelatedSimilarPrice(any(), any(), any(), any()))
            .thenReturn(List.of());
        when(listingRepository.findRelatedFromSeller(any(), any(), any()))
            .thenReturn(List.of());
        when(listingRepository.findRelatedAnywhere(any(), any(), any()))
            .thenReturn(List.of(sample()));

        mvc.perform(get("/api/listings/1229780/similar"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.same_location").isArray())
           .andExpect(jsonPath("$.anywhere").isArray())
           .andExpect(jsonPath("$.similar_price").isArray())
           .andExpect(jsonPath("$.from_seller").isArray());
    }
}
