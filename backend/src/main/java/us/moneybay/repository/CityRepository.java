package us.moneybay.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import us.moneybay.model.City;
import java.util.Collection;
import java.util.Optional;

public interface CityRepository extends JpaRepository<City, Long> {
    Optional<City> findByName(String name);
    Optional<City> findBySubdomain(String subdomain);
    void deleteBySubdomainNotIn(Collection<String> subdomains);
}
