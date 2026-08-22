package us.moneybay.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import us.moneybay.model.Listing;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Состав ответа по объявлению.
 *
 * Написан после дефекта, из-за которого поле status встало между
 * @JsonProperty("created_at") и полем createdAt: аннотация привязалась к
 * статусу, и все объявления уходили с created_at = "ACTIVE". Фронт гнал это
 * через DatePipe, тот бросал ошибку на строке вместо даты, и карточка
 * переставала рисоваться — лента заполнялась белыми рамками.
 *
 * Сборка и запуск такое пропускают: код законный, ошибка только в том, что
 * уходит наружу. Поэтому проверяется сам JSON, а не поля класса.
 */
class ListingDtoTest {

    private ObjectMapper mapper;

    @BeforeEach
    void setUp() {
        // Настройки те же, что Spring Boot ставит при запуске: даты строками
        // ISO-8601. Без отключения WRITE_DATES_AS_TIMESTAMPS Jackson пишет их
        // числом секунд, и проверка смотрела бы не на то, что уходит клиенту —
        // сервер отдаёт 2026-08-16T08:20:46.541666Z.
        mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /** Объявление со всеми заполненными полями. */
    private Listing sample() {
        Listing l = new Listing();
        l.setId(1229780L);
        l.setTitle("Electronics item #1932908");
        l.setDescription("Gently used, no visible wear.");
        l.setPrice(3673.21);
        l.setLocation("South Portland, ME");
        l.setArea("South Portland");
        l.setImages(List.of("photo.webp"));
        l.setViews(255);
        l.setActive(true);
        l.setFeatured(false);
        l.setCreatedAt(Instant.parse("2026-08-20T23:30:32Z"));
        l.setStatus(Listing.ListingStatus.ACTIVE);

        us.moneybay.model.User seller = new us.moneybay.model.User();
        seller.setId(20068L);
        seller.setUsername("seller20005");
        l.setUser(seller);

        return l;
    }

    private JsonNode render(Listing listing) throws Exception {
        return mapper.readTree(mapper.writeValueAsString(ListingDto.from(listing)));
    }

    @Test
    @DisplayName("created_at несёт дату, а не что-то другое")
    void createdAtIsADate() throws Exception {
        JsonNode json = render(sample());

        assertTrue(json.has("created_at"), "поля created_at нет в ответе");
        String raw = json.get("created_at").asText();

        // Именно здесь падал прежний дефект: тут стояло "ACTIVE"
        assertDoesNotThrow(() -> Instant.parse(raw),
            "created_at не разбирается как дата: " + raw);
        assertEquals(Instant.parse("2026-08-20T23:30:32Z"), Instant.parse(raw));
    }

    @Test
    @DisplayName("имена полей те, что читает фронт")
    void fieldNamesMatchTheClient() throws Exception {
        JsonNode json = render(sample());

        // Фронт читает эти имена. Пропажа любого гасит часть карточки
        for (String field : List.of("id", "title", "description", "price",
                                    "location", "images", "views",
                                    "created_at", "is_active", "is_featured",
                                    "promoted_until", "user_id", "category_id")) {
            assertTrue(json.has(field), "в ответе нет поля " + field);
        }
    }

    @Test
    @DisplayName("типы полей те, что ждёт фронт")
    void fieldTypesMatchTheClient() throws Exception {
        JsonNode json = render(sample());

        assertTrue(json.get("id").isNumber(), "id должен быть числом");
        assertTrue(json.get("price").isNumber(), "price должен быть числом");
        assertTrue(json.get("views").isNumber(), "views должен быть числом");
        assertTrue(json.get("title").isTextual(), "title должен быть строкой");
        assertTrue(json.get("images").isArray(), "images должен быть массивом");
        assertTrue(json.get("is_active").isBoolean(), "is_active должен быть логическим");
        assertTrue(json.get("is_featured").isBoolean(), "is_featured должен быть логическим");
    }

    @Test
    @DisplayName("объявление без цены, фотографий и продвижения не роняет отрисовку")
    void sparseListingStillRenders() throws Exception {
        Listing bare = new Listing();
        bare.setId(8L);
        bare.setTitle("cars");

        JsonNode json = render(bare);

        assertEquals(8, json.get("id").asLong());
        assertTrue(json.get("images").isArray());
        assertEquals(0, json.get("images").size());
        assertTrue(json.get("price").isNull() || json.get("price").isNumber());
        assertTrue(json.get("promoted_until").isNull(),
            "promoted_until без продвижения должно быть null");
    }

    @Test
    @DisplayName("имя продавца отдаётся, а почта — нет")
    void sellerNameTravelsWithoutTheEmail() throws Exception {
        JsonNode json = render(sample());

        assertEquals("seller20005", json.get("user_name").asText());
        // Почта — личные данные, покупателям её видеть незачем
        assertFalse(json.has("email"), "почта продавца не должна уходить наружу");
        assertFalse(json.has("user_email"), "почта продавца не должна уходить наружу");
    }

    @Test
    @DisplayName("продавец и категория отдаются числами, а не объектами")
    void ownerAndCategoryComeAsIds() throws Exception {
        JsonNode json = render(sample());

        // Без продавца и категории — null, но не объект: фронт читает число
        assertFalse(json.get("user_id").isObject(), "user_id не должен быть объектом");
        assertFalse(json.get("category_id").isObject(), "category_id не должен быть объектом");
    }
}
