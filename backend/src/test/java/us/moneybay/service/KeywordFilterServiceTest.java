package us.moneybay.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import us.moneybay.model.KeywordFilter;
import us.moneybay.repository.KeywordFilterRepository;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class KeywordFilterServiceTest {

    @Mock
    private KeywordFilterRepository repo;

    @InjectMocks
    private KeywordFilterService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCheckContentWithSpamKeyword() {
        KeywordFilter spam = new KeywordFilter();
        spam.setWord("free money");
        spam.setCategory(KeywordFilter.FilterCategory.SPAM);
        spam.setSeverity(2);

        when(repo.findActiveFilters()).thenReturn(Arrays.asList(spam));

        KeywordFilterService.KeywordFilterResult result = 
            service.checkContent("Get free money now!", "Click here");

        assertTrue(result.matched);
        assertEquals(2, result.severity);
        assertEquals(KeywordFilter.FilterCategory.SPAM, result.category);
    }

    @Test
    void testCheckContentNoMatch() {
        KeywordFilter filter = new KeywordFilter();
        filter.setWord("bitcoin");

        when(repo.findActiveFilters()).thenReturn(Arrays.asList(filter));

        KeywordFilterService.KeywordFilterResult result = 
            service.checkContent("Selling used laptop", "Good condition");

        assertFalse(result.matched);
    }

    @Test
    void testCheckContentProhibitedItem() {
        KeywordFilter prohibited = new KeywordFilter();
        prohibited.setWord("gun");
        prohibited.setCategory(KeywordFilter.FilterCategory.PROHIBITED_ITEM);
        prohibited.setSeverity(3);

        when(repo.findActiveFilters()).thenReturn(Arrays.asList(prohibited));

        KeywordFilterService.KeywordFilterResult result = 
            service.checkContent("Selling gun", "Used but in good condition");

        assertTrue(result.matched);
        assertEquals(3, result.severity);
    }

    @Test
    void testAddKeywordDuplicate() {
        when(repo.existsByWordIgnoreCase("free money")).thenReturn(true);

        KeywordFilter result = service.addKeyword("free money", KeywordFilter.FilterCategory.SPAM, 2);

        assertNull(result);
        verify(repo, never()).save(any());
    }
}
