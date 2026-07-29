package us.moneybay.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import us.moneybay.model.KeywordFilter;
import us.moneybay.repository.KeywordFilterRepository;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class KeywordFilterService {
    private static final Logger log = LoggerFactory.getLogger(KeywordFilterService.class);
    
    @Autowired
    private KeywordFilterRepository repo;

    // Open-source spam keywords (initial list)
    private static final String[] DEFAULT_SPAM_KEYWORDS = {
        "free money", "click here", "earn quick", "bitcoin", "forex",
        "get rich", "make money fast", "limited offer", "act now"
    };

    private static final String[] DEFAULT_PROHIBITED_KEYWORDS = {
        "gun", "firearm", "weapon", "drug", "cocaine", "heroin",
        "fake id", "counterfeit", "stolen", "illegal"
    };

    @Cacheable("keywords")
    public List<KeywordFilter> getActiveFilters() {
        return repo.findActiveFilters();
    }

    public KeywordFilterResult checkContent(String title, String description) {
        List<KeywordFilter> filters = getActiveFilters();
        String combined = (title + " " + description).toLowerCase();

        for (KeywordFilter filter : filters) {
            if (combined.contains(filter.getWord().toLowerCase())) {
                log.warn("Keyword filter triggered: {} (severity: {})", 
                    filter.getWord(), filter.getSeverity());
                return new KeywordFilterResult(true, filter.getSeverity(), filter.getCategory());
            }
        }
        return new KeywordFilterResult(false, 0, null);
    }

    @CacheEvict("keywords")
    public KeywordFilter addKeyword(String word, KeywordFilter.FilterCategory category, Integer severity) {
        if (repo.existsByWordIgnoreCase(word)) {
            log.warn("Keyword already exists: {}", word);
            return null;
        }
        KeywordFilter kf = new KeywordFilter();
        kf.setWord(word.toLowerCase());
        kf.setCategory(category);
        kf.setSeverity(severity != null ? severity : 1);
        kf.setActive(true);
        return repo.save(kf);
    }

    @CacheEvict("keywords")
    public void initializeDefaultKeywords() {
        log.info("Initializing default keywords...");
        
        Arrays.stream(DEFAULT_SPAM_KEYWORDS)
            .forEach(kw -> addKeyword(kw, KeywordFilter.FilterCategory.SPAM, 2));
        
        Arrays.stream(DEFAULT_PROHIBITED_KEYWORDS)
            .forEach(kw -> addKeyword(kw, KeywordFilter.FilterCategory.PROHIBITED_ITEM, 3));
        
        log.info("Default keywords initialized");
    }

    public static class KeywordFilterResult {
        public boolean matched;
        public int severity; // 1=warn, 2=hide, 3=auto-ban
        public KeywordFilter.FilterCategory category;

        public KeywordFilterResult(boolean matched, int severity, KeywordFilter.FilterCategory category) {
            this.matched = matched;
            this.severity = severity;
            this.category = category;
        }
    }
}
