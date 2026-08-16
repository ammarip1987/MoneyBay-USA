package us.moneybay;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Профиль test поднимает H2 из application-test.properties.
 * Без него тест забирал основные настройки и поднимал контекст против
 * рабочей базы, а DataInitializer при старте её изменяет.
 */
@SpringBootTest
@ActiveProfiles("test")
class MoneybayBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
