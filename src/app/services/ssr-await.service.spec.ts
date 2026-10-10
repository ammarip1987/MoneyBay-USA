import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, PendingTasks } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { SsrAwaitService } from './ssr-await.service';

/**
 * Проверки на службу, которая держит отдачу страницы до ответа.
 *
 * Она роняла сайт дважды, и оба раза по одной причине: задача не отпускалась.
 * Первый раз страница объявления уходила пустой, второй — несуществующее
 * объявление вешало отрисовку на тридцать секунд.
 *
 * Отсюда главное: задача отпускается при любом исходе — ответе, отказе,
 * отписке.
 *
 * PendingTasks подменяется заглушкой, а не берётся настоящий: его внутренний
 * счётчик закрыт, а ApplicationRef.whenStable в TestBed исполняется
 * независимо от незавершённых задач — проверка через него проходила даже на
 * намеренно сломанной службе.
 */
class PendingTasksStub {
  /** Сколько задач заведено и не отпущено. */
  open = 0;
  /** Сколько заводилось всего — чтобы видеть, что обёртка вообще сработала. */
  added = 0;

  add(): () => void {
    this.added++;
    this.open++;
    let released = false;
    return () => {
      // Повторный вызов не должен уводить счётчик в минус: обёртка зовёт
      // завершение и при отписке, и при завершении потока
      if (released) return;
      released = true;
      this.open--;
    };
  }
}

describe('SsrAwaitService', () => {
  describe('в браузере', () => {
    let service: SsrAwaitService;
    let tasks: PendingTasksStub;

    beforeEach(() => {
      tasks = new PendingTasksStub();
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: PendingTasks, useValue: tasks }
        ]
      });
      service = TestBed.inject(SsrAwaitService);
    });

    it('отдаёт тот же поток без обёртки', () => {
      const source = of('значение');
      expect(service.wrap(source)).toBe(source);
    });

    it('не заводит задач: в браузере держать нечего', () => {
      service.wrap(of('значение')).subscribe();
      expect(tasks.added).toBe(0);
    });
  });

  describe('на сервере', () => {
    let service: SsrAwaitService;
    let tasks: PendingTasksStub;

    beforeEach(() => {
      tasks = new PendingTasksStub();
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: PendingTasks, useValue: tasks }
        ]
      });
      service = TestBed.inject(SsrAwaitService);
    });

    it('оборачивает поток, а не отдаёт исходный', () => {
      const source = of('значение');
      expect(service.wrap(source)).not.toBe(source);
    });

    it('заводит задачу при подписке', () => {
      const source = new Subject<string>();
      service.wrap(source).subscribe();
      expect(tasks.added).toBe(1);
      expect(tasks.open).toBe(1);
    });

    it('пропускает значение насквозь', async () => {
      const values: string[] = [];
      await new Promise<void>(resolve => {
        service.wrap(of('объявление')).subscribe({
          next: v => values.push(v),
          complete: resolve
        });
      });
      expect(values).toEqual(['объявление']);
    });

    it('доносит отказ, а не глотает его', async () => {
      const err = new Error('404');
      const caught = await new Promise<unknown>(resolve => {
        service.wrap(throwError(() => err)).subscribe({ error: e => resolve(e) });
      });
      expect(caught).toBe(err);
    });

    it('отпускает задачу после ответа', () => {
      const source = new Subject<string>();
      service.wrap(source).subscribe();

      source.next('данные');
      source.complete();

      expect(tasks.open).toBe(0);
    });

    it('отпускает задачу при отказе', () => {
      const source = new Subject<string>();
      service.wrap(source).subscribe({ error: () => undefined });

      source.error(new Error('отказ'));

      // Вот этот случай и вешал /listing/999999999 на тридцать секунд
      expect(tasks.open).toBe(0);
    });

    it('отпускает задачу при отписке до ответа', () => {
      const source = new Subject<string>();
      const sub = service.wrap(source).subscribe();

      // Так ведёт себя отрисовка, когда переход отменён
      sub.unsubscribe();

      expect(tasks.open).toBe(0);
    });
  });
});
