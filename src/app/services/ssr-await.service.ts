import { Injectable, inject, PendingTasks, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Observable } from 'rxjs';

/**
 * Задержка отдачи страницы до ответа — только на сервере.
 *
 * Приложение работает без zone.js, и сервер сам не отслеживает незавершённые
 * запросы: он отдавал каркас, не дождавшись ответа. Страницы уходили пустыми,
 * а на объявлении срабатывала ветка ошибки и ставила заголовок
 * "Listing not found" — поисковые системы видели ненайденную страницу вместо
 * товара.
 *
 * PendingTasks держит отдачу, пока запрос не завершится. Ответ затем попадает
 * в браузер вместе со страницей через withHttpTransferCacheOptions, и
 * повторного запроса не будет.
 *
 * В браузере обёртка ничего не меняет: запрос уходит как прежде.
 *
 * Отдельная служба, а не метод ApiService: часть страниц обращается к
 * HttpClient напрямую, минуя ApiService, и им обёртка нужна тоже.
 */
@Injectable({ providedIn: 'root' })
export class SsrAwaitService {
  private readonly pending = inject(PendingTasks);
  private readonly onServer = isPlatformServer(inject(PLATFORM_ID));

  wrap<T>(request: Observable<T>): Observable<T> {
    if (!this.onServer) {
      return request;
    }
    // add, а не run: run возвращает void, и результат запроса через него не
    // достать. add выдаёт функцию завершения — её вызываем и при ответе, и при
    // отказе, иначе отдача страницы повиснет до тайм-аута
    return new Observable<T>(subscriber => {
      const done = this.pending.add();
      const sub = request.subscribe({
        next: value => subscriber.next(value),
        error: err => { done(); subscriber.error(err); },
        complete: () => { done(); subscriber.complete(); }
      });
      return () => { done(); sub.unsubscribe(); };
    });
  }
}
