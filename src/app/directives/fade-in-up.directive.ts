import { Directive, ElementRef, inject, OnDestroy, OnInit, Input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appFadeInUp]',
  standalone: true
})
export class FadeInUpDirective implements OnInit, OnDestroy {
  @Input() appFadeInUpDelay = 0;
  @Input() appFadeInUpThreshold = 0.1;
  @Input() appFadeInUpDuration = 600;

  private el = inject(ElementRef<HTMLElement>);
  private platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const element = this.el.nativeElement;
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = `opacity ${this.appFadeInUpDuration}ms ease-out, transform ${this.appFadeInUpDuration}ms ease-out`;
    element.style.transitionDelay = `${this.appFadeInUpDelay}ms`;
    element.style.willChange = 'opacity, transform';

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            this.observer?.unobserve(element);
            setTimeout(() => {
              element.style.willChange = 'auto';
            }, this.appFadeInUpDuration + this.appFadeInUpDelay);
          }
        });
      },
      { threshold: this.appFadeInUpThreshold, rootMargin: '0px 0px -50px 0px' }
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
