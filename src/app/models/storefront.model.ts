/**
 * Витрина продавца — то, что видят покупатели.
 *
 * Правовых сведений здесь нет намеренно: EIN, юридический адрес и банковский
 * счёт собирает Stripe на своей стороне. Площадка хранит лишь состояние
 * проверки, поэтому не отвечает за утечку персональных данных и за проверку по
 * INFORM Consumers Act.
 */
export interface Storefront {
  id: number;
  /** Название магазина в выдаче и на странице. */
  name: string;
  /** Часть адреса: /shop/{slug}. Задаётся при создании. */
  slug: string;
  about?: string;
  logoUrl?: string;
  bannerUrl?: string;
  /** Город и штат: точный адрес не показывается. */
  location?: string;
  /** Телефоны через запятую; открываются по нажатию. */
  phones?: string;
  website?: string;
  /** Часы работы свободным текстом. */
  hours?: string;
  published: boolean;

  /** Состояние проверки Stripe: видно только владельцу. */
  verificationStatus: VerificationStatus;
  /** Разрешены ли выплаты — приходит от Stripe. */
  payoutsEnabled: boolean;
}

export type VerificationStatus =
  /** Проверка не начиналась. */
  | 'NOT_STARTED'
  /** Документы у Stripe, ответа ещё нет. */
  | 'PENDING'
  /** Проверка не пройдена. */
  | 'REJECTED'
  /** Проверка пройдена, выплаты разрешены. */
  | 'VERIFIED';

/** Открытая страница магазина: витрина и объявления продавца. */
export interface PublicStorefront {
  storefront: Storefront;
  listings: import('./listing.model').Listing[];
  listings_count: number;
}
