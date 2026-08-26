package us.moneybay.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import us.moneybay.model.User;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Состав ответа о пользователе.
 *
 * Написан после того, как в профиле на месте даты заведения учётной записи было
 * пусто: DTO отдавал поле как createdAt, а страницы читают created_at. Тот же
 * вид дефекта уже был с объявлениями — имя в JSON расходится с ожидаемым, код
 * при этом законный, сборка проходит.
 */
class UserDtoTest {

    private ObjectMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    private User sample() {
        User user = new User();
        user.setId(20068L);
        user.setEmail("seller@example.com");
        user.setUsername("seller20005");
        user.setPhone("614-555-0142");
        user.setCity("Columbus, OH");
        user.setAvatarUrl("photo.webp");
        user.setShowAvatar(true);
        user.setCreatedAt(Instant.parse("2025-07-20T03:14:19Z"));
        return user;
    }

    private JsonNode render(User user) throws Exception {
        return mapper.readTree(mapper.writeValueAsString(UserDto.from(user)));
    }

    @Test
    @DisplayName("дата заведения уходит под именем created_at")
    void joinDateShipsAsCreatedAt() throws Exception {
        JsonNode json = render(sample());

        assertTrue(json.has("created_at"), "страницы читают created_at, а поля нет");
        assertFalse(json.has("createdAt"), "старое имя не должно уходить вторым полем");
        assertEquals(Instant.parse("2025-07-20T03:14:19Z"),
            Instant.parse(json.get("created_at").asText()));
    }

    @Test
    @DisplayName("прочие имена оставлены как их читает фронт")
    void otherNamesStayAsTheClientReadsThem() throws Exception {
        JsonNode json = render(sample());

        // Эти два фронт читает без подчёркиваний — переименование сломало бы
        // шесть с лишним мест
        for (String field : List.of("id", "email", "username", "phone", "city",
                                    "avatarUrl", "showAvatar")) {
            assertTrue(json.has(field), "в ответе нет поля " + field);
        }
    }

    @Test
    @DisplayName("пароль наружу не уходит")
    void passwordNeverShips() throws Exception {
        User user = sample();
        user.setPassword("$2a$10$abcdefghijklmnop");

        JsonNode json = render(user);

        assertFalse(json.has("password"), "пароль не должен уходить клиенту");
    }

    @Test
    @DisplayName("незаполненные поля не роняют отрисовку")
    void sparseUserStillRenders() throws Exception {
        User bare = new User();
        bare.setId(1L);
        bare.setEmail("a@b.com");
        bare.setUsername("a");

        JsonNode json = render(bare);

        assertEquals(1, json.get("id").asLong());
        assertTrue(json.get("created_at").isNull(),
            "без даты поле должно быть null, а не отсутствовать");
    }
}
