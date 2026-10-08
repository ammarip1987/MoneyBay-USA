import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideServiceWorker } from '@angular/service-worker';
import { App } from './app';

/**
 * Проверка сборки корневого компонента.
 *
 * Службы объявляются поимённо: в Angular 22 корневой компонент больше не
 * получает их сам, и без provideServiceWorker тест падал на NG0201 —
 * SwUpdate некому было выдать. enabled: false, чтобы обработчик при проверке
 * не поднимался.
 *
 * Проверка заголовка «Hello, moneybay-angular» убрана: она осталась от
 * заготовки, такого заголовка на площадке нет.
 */
describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideServiceWorker('ngsw-worker.js', { enabled: false })
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the header and footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });
});
