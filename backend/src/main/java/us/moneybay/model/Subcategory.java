package us.moneybay.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "subcategories", uniqueConstraints = @UniqueConstraint(columnNames = {"category_id", "slug"}))
public class Subcategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    private String icon;
    private String color;

    /**
     * Порядок вывода среди соседей. Без него плитки шли по id, то есть по
     * времени создания, и осмысленную последовательность задать было нельзя.
     */
    // columnDefinition задаёт умолчание на уровне базы: без него ddl-auto=update
    // добавляет колонку, а существующие строки остаются с NULL и нарушают not-null
    @Column(name = "sort_order", nullable = false, columnDefinition = "integer default 0")
    private Integer sortOrder = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Subcategory parent;
}
