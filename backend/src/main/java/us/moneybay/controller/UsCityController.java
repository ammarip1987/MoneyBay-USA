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

/** Автоподстановка городов в поле City / Area, в пределах выбранного штата. */
@RestController
@RequestMapping("/api/us-cities")
@RequiredArgsConstructor
public class UsCityController {

    private static final int MAX_LIMIT = 25;

    private final UsCityRepository usCityRepository;

    @GetMapping
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
            item.put("population", c.getPopulation());
            return item;
        }).toList();
    }
}
