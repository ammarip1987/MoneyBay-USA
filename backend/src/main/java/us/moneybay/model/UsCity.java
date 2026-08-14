package us.moneybay.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Справочник городов США для автоподстановки в поле City / Area.
 * Отдельно от City: там хранятся штаты, на которые завязаны субдомены
 * и listings.location. Связь со штатом — по двухбуквенному коду.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "us_city")
public class UsCity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(name = "state_code", nullable = false, length = 2)
    private String stateCode;

    @Column(name = "state_name", nullable = false, length = 64)
    private String stateName;

    @Column(nullable = false)
    private Integer population;
}
