package us.moneybay.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import us.moneybay.config.CityContext;
import us.moneybay.model.City;
import us.moneybay.repository.CityRepository;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cities")
public class CityController {

    private final CityRepository cityRepository;

    public CityController(CityRepository cityRepository) {
        this.cityRepository = cityRepository;
    }

    @GetMapping
    public List<City> list() {
        return cityRepository.findAll();
    }

    @GetMapping("/current")
    public ResponseEntity<City> current() {
        String subdomain = CityContext.getSubdomain();
        if (subdomain == null) return ResponseEntity.noContent().build();
        Optional<City> match = cityRepository.findBySubdomain(subdomain);
        return match.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }
}
