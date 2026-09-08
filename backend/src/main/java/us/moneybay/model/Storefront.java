package us.moneybay.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Витрина продавца: то, что видят покупатели.
 *
 * Правовые сведения — налоговый номер, юридический адрес, банковский счёт —
 * здесь намеренно отсутствуют. Их собирает Stripe на своей стороне, и площадка
 * хранит лишь идентификатор учётной записи и признак пройденной проверки: иначе
 * пришлось бы отвечать за утечку персональных данных.
 */
@Entity
@Table(name = "storefronts")
@Getter
@Setter
public class Storefront {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** Имя магазина в выдаче и на странице. */
    @Column(nullable = false)
    private String name;

    /** Часть адреса: /shop/{slug}. Задаётся при создании, дальше не меняется. */
    @Column(nullable = false, unique = true)
    private String slug;

    @Column(length = 2000)
    private String about;

    /** Квадратный логотип в хранилище R2. */
    @Column(name = "logo_url")
    private String logoUrl;

    /** Горизонтальная обложка страницы. */
    @Column(name = "banner_url")
    private String bannerUrl;

    /** Город и штат — точный адрес не показывается: личная безопасность. */
    @Column(name = "location")
    private String location;

    /** Дополнительные телефоны через запятую; открываются по нажатию. */
    @Column(name = "phones", length = 500)
    private String phones;

    @Column(name = "website")
    private String website;

    /** Часы работы свободным текстом: «Mon-Fri 9am-6pm». */
    @Column(name = "hours", length = 500)
    private String hours;

    /** Показывать ли витрину покупателям. */
    @Column(name = "is_published", nullable = false,
            columnDefinition = "boolean not null default false")
    private boolean published = false;

    // --- Stripe Connect: заполняется после проверки, вводу не подлежит ---

    /** Учётная запись Stripe Connect, вида acct_... */
    @Column(name = "stripe_account_id")
    private String stripeAccountId;

    /** Состояние проверки: NOT_STARTED, PENDING, REJECTED, VERIFIED. */
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false,
            columnDefinition = "varchar(20) not null default 'NOT_STARTED'")
    private VerificationStatus verificationStatus = VerificationStatus.NOT_STARTED;

    /** Разрешены ли выплаты: приходит от Stripe уведомлением account.updated. */
    @Column(name = "payouts_enabled", nullable = false,
            columnDefinition = "boolean not null default false")
    private boolean payoutsEnabled = false;

    /** Тариф витрины: FREE, BASIC, PRO. */
    @Enumerated(EnumType.STRING)
    @Column(name = "plan", nullable = false,
            columnDefinition = "varchar(16) not null default 'FREE'")
    private Plan plan = Plan.FREE;

    /** Докуда оплачено. Пусто у бесплатного: срок ему не нужен. */
    @Column(name = "plan_until")
    private Instant planUntil;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    /**
     * Тариф витрины.
     *
     * Предел товаров задан здесь, а не в настройках: он часть договорённости с
     * продавцом, и менять его на ходу нельзя без пересмотра оплаченного.
     */
    public enum Plan {
        /** Бесплатно: до десяти товаров, простая страница. */
        FREE(0, 10),
        /** Девять долларов в месяц: до ста товаров, обложка и часы работы. */
        BASIC(900, 100),
        /** Двадцать девять в месяц: без предела, выделение в разделе. */
        PRO(2900, Integer.MAX_VALUE);

        /** Цена в центах: Stripe считает в наименьших единицах. */
        public final int priceCents;
        /** Сколько товаров разрешено. */
        public final int listingLimit;

        Plan(int priceCents, int listingLimit) {
            this.priceCents = priceCents;
            this.listingLimit = listingLimit;
        }
    }

    public enum VerificationStatus {
        /** Проверка не начиналась. */
        NOT_STARTED,
        /** Документы у Stripe, ответа ещё нет. */
        PENDING,
        /** Проверка не пройдена: сведения не сошлись. */
        REJECTED,
        /** Проверка пройдена, выплаты разрешены. */
        VERIFIED
    }
}
