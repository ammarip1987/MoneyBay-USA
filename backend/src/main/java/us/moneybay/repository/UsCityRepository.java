package us.moneybay.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import us.moneybay.model.UsCity;

import java.util.List;

public interface UsCityRepository extends JpaRepository<UsCity, Long> {

    /**
     * Города штата по подстроке названия. Штат задаётся полным названием
     * ("California") либо двухбуквенным кодом ("CA") — форма располагает первым.
     * Сначала совпадения с начала строки, затем вхождения внутри; внутри группы
     * по убыванию населения, чтобы крупный город не встал ниже одноимённого посёлка.
     */
    @Query("SELECT c FROM UsCity c " +
           "WHERE (LOWER(c.stateName) = :state OR LOWER(c.stateCode) = :state) " +
           "AND (:q = '' OR LOWER(c.name) LIKE CONCAT('%', :q, '%')) " +
           "ORDER BY CASE WHEN LOWER(c.name) LIKE CONCAT(:q, '%') THEN 0 ELSE 1 END, " +
           "c.population DESC, c.name ASC")
    List<UsCity> search(@Param("state") String lowercaseState,
                        @Param("q") String lowercaseQuery,
                        Pageable pageable);

    @Query("SELECT COUNT(c) > 0 FROM UsCity c " +
           "WHERE LOWER(c.name) = :name " +
           "AND (LOWER(c.stateName) = :state OR LOWER(c.stateCode) = :state)")
    boolean existsInState(@Param("name") String lowercaseName, @Param("state") String lowercaseState);
}
