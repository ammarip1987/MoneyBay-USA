package us.moneybay.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import us.moneybay.model.UsCity;
import us.moneybay.repository.UsCityRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Справочник штатов и городов США для полей State и City / Area.
 * Штаты выводятся из того же справочника, отдельной таблицы под них нет.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UsCityController {

    private static final int MAX_LIMIT = 25;

    private final UsCityRepository usCityRepository;

    /** 51 штат плюс DC, по алфавиту — для выпадающего списка. */
    @GetMapping("/states")
    public List<Map<String, String>> states() {
        return usCityRepository.findDistinctStates().stream().map(row -> {
            Map<String, String> item = new LinkedHashMap<>();
            item.put("code", (String) row[0]);
            item.put("name", (String) row[1]);
            return item;
        }).toList();
    }

    @GetMapping("/us-cities")
    public List<Map<String, Object>> suggest(@RequestParam String state,
                                            @RequestParam(required = false, defaultValue = "") String q,
                                            @RequestParam(required = false, defaultValue = "10") int limit) {
        if (state == null || state.isBlank()) return List.of();
        if (limit < 1) limit = 1;
        if (limit > MAX_LIMIT) limit = MAX_LIMIT;

        List<UsCity> found = usCityRepository.search(
            state.trim().toLowerCase(),
            q.trim().toLowerCase(),
            PageRequest.of(0, limit));

        return found.stream().map(c -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", c.getName());
            item.put("state_code", c.getStateCode());
            // Строка, которая уходит в listings.location — формат совпадает с таблицей cities
            item.put("display_name", c.getName() + ", " + c.getStateCode());
            item.put("population", c.getPopulation());
            return item;
        }).toList();
    }
}
