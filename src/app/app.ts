import { Component, inject, afterNextRender } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ToastComponent } from './components/toast/toast.component';
import { ScrollTopComponent } from './components/scroll-top/scroll-top.component';
import { CityContextService } from './services/city-context.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent, ScrollTopComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private swUpdate = inject(SwUpdate);

  constructor() {
    inject(CityContextService).init();
    // Drop stale (expired) sessions on app start
    inject(AuthService).validateSession();

    // Свежая сборка подхватывается сама. Прежде запас обслуживающего работника
    // держал прежнюю версию сайта, и правки доходили лишь после того, как
    // посетитель сам чистил кэш — а чаще не доходили вовсе
    afterNextRender(() => {
      if (!this.swUpdate.isEnabled) return;
      this.swUpdate.versionUpdates.subscribe(e => {
        if (e.type === 'VERSION_READY') {
          // Страница берёт свежее при следующем переходе, а не рывком под
          // руками у того, кто заполняет форму
          this.swUpdate.activateUpdate();
        }
      });
      this.swUpdate.checkForUpdate();
    });
  }
}
