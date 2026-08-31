# Рекламный баннер над шапкой

Файл кладётся сюда, например `public/promo/banner.jpg`.

Показ: полоса над шапкой в `src/app/components/header/header.component.ts`.
Сейчас там надпись `Advertising` — замените её на изображение:

```html
<img src="/promo/banner.jpg" alt="" class="mx-auto max-h-16">
```

Ссылка на страницу рекламодателя ставится в `href` того же элемента.

Что в этой папке лежит, то и раздаётся с сайта по адресу `/promo/имя-файла`.
