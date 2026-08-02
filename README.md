# Andrey AI Lab

Личный блог об AI-архитектуре и AI-оптимизации бизнес-процессов. Статический сайт в минималистичном визуальном стиле, вдохновлённом фильмом «Обливион».

## Источник правды

Все статьи пишутся в формате Markdown в папке `src/articles/`. Оттуда сборка генерирует:

- `articles/{slug}/index.html` — страницы отдельных статей
- `data/articles.json` — метаданные для фронтенда
- `rss.xml` — RSS-лента

**Не редактируй вручную:** `articles/{slug}/index.html`, `data/articles.json`, `rss.xml` — они создаются автоматически.

## Структура проекта

```
oblivion-blog/
├── index.html                    # Главная страница
├── articles.html                 # Архив всех статей с фильтрами
├── rss.xml                       # RSS-лента (генерируется автоматически)
├── build.js                      # Сборка сайта из markdown
├── generate-rss.js               # Генератор RSS
├── new-article.js                # CLI для создания новой статьи
├── data/
│   └── articles.json             # Метаданные статей (генерируется)
├── articles/                     # HTML-страницы статей (генерируются)
├── src/
│   ├── articles/                 # Markdown-источники статей
│   └── templates/
│       └── article.html          # Шаблон страницы статьи
├── templates/
│   ├── header.html               # Переиспользуемый хедер
│   └── footer.html               # Переиспользуемый футер
├── css/
│   └── style.css
└── js/
    ├── components.js             # Подгрузка header/footer
    ├── articles-list.js          # Рендер карточек из JSON
    └── main.js                   # Анимации и интерактивность
```

## Локальный запуск

```bash
cd oblivion-blog
npm run dev
```

Открыть в браузере: `http://localhost:3000`

## Как добавить новую статью

### Вариант 1: Через CLI

```bash
npm run new-article -- --slug ai-audit \
  --title "AI-аудит бизнес-процессов" \
  --description "Как найти узкие места с помощью многоагентной системы" \
  --tags "AI-архитектура, Аудит" \
  --featured
```

Параметры:

- `--slug` — уникальный идентификатор для URL (обязательный).
- `--title` — заголовок статьи (обязательный).
- `--description` — краткое описание для карточки и RSS.
- `--date` — дата публикации в формате `YYYY-MM-DD`. По умолчанию сегодня.
- `--tags` — список тегов через запятую.
- `--featured` — добавить статью на главную страницу.

После создания отредактируй `src/articles/{slug}.md` и запусти сборку:

```bash
npm run build
```

### Вариант 2: Вручную

Создай файл `src/articles/{slug}.md` с frontmatter:

```markdown
---
slug: ai-audit
title: 'AI-аудит бизнес-процессов'
description: 'Как найти узкие места с помощью многоагентной системы'
date: 2026-08-10
tags:
  - AI-архитектура
  - Аудит
featured: true
---

Текст статьи в Markdown...
```

Затем запусти:

```bash
npm run build
```

### Черновики

Чтобы статья не публиковалась, добавь `draft: true` в frontmatter:

```yaml
---
slug: zagotovka
title: 'Черновик статьи'
draft: true
---
```

## Как обновить существующую статью

1. Отредактируй `src/articles/{slug}.md`.
2. Запусти `npm run build`.
3. Проверь результат через `npm run serve`.

## Рекомендации по контенту

### Форматы статей

- Разбор реального кейса
- Сравнение подходов/инструментов
- Пошаговый гайд
- Что пошло не так (фейл + выводы)
- Короткая заметка-инсайт

### Мета-данные

Для каждой статьи прописывай:

- `title` — 50-60 символов
- `description` — 120-160 символов
- дату публикации
- 1-3 тега

### Изображения

Создай папку `images/` в корне проекта:

```markdown
![Описание изображения](../../images/shema.png)
```

Для схем и диаграмм:

- **Excalidraw** — рукописные схемы
- **Mermaid** — диаграммы через код
- **Figma** — сложные иллюстрации

### Частота публикаций

Для экспериментального блога оптимально **1 статья в 1-2 недели**. Качество важнее количества.

## Автопубликация в LinkedIn

Сайт экспортирует RSS-ленту по адресу `/rss.xml`. На её основе можно настроить автопостинг в LinkedIn через n8n, Make или Zapier:

1. Деплой сайт на хостинг с постоянным URL.
2. В n8n / Make создай сценарий, который раз в час проверяет `https://tvoy-domen.com/rss.xml`.
3. При появлении нового `<item>` формируй текст поста и публикуй его через LinkedIn API.

> Для личного профиля LinkedIn проще всего отправлять готовый текст поста тебе на утверждение, а не публиковать сразу.



## Деплой на GitHub Pages

В проекте уже настроен GitHub Actions workflow (`.github/workflows/deploy.yml`). Он собирает сайт из markdown и публикует его автоматически при каждом пуше в `main`.

### Подготовка

1. Создай репозиторий `andrey-ai-lab` на GitHub.
2. Запушь код в ветку `main`:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/semandr72-eng/andrey-ai-lab.git
   git push -u origin main
   ```

### Настройка Pages

1. Открой репозиторий на GitHub.
2. Перейди в **Settings → Pages**.
3. В разделе **Build and deployment** выбери **Source: GitHub Actions**.
4. Перейди в **Settings → Actions → General → Workflow permissions**.
5. Выбери **Read and write permissions** и нажми **Save**.

### Первый деплой

1. Перейди во вкладку **Actions** репозитория.
2. Открой workflow **Deploy to GitHub Pages**.
3. Если он не запустился автоматически, нажми **Run workflow → Run workflow**.
4. Дождись зелёной галочки.

Сайт будет доступен по адресу:
```
https://semandr72-eng.github.io/andrey-ai-lab/
```

### Обновление сайта

После каждого изменения:

```bash
npm run build
git add .
git commit -m "Add new article"
git push origin main
```

GitHub Actions автоматически пересоберёт и опубликует сайт.

### Свой домен (опционально)

1. В корне проекта создай файл `CNAME` с доменом:
   ```
   tvoy-domen.com
   ```
2. В `.github/workflows/deploy.yml` замени `BASE_URL` на свой домен:
   ```yaml
   BASE_URL: "https://tvoy-domen.com"
   ```
3. Настрой DNS-записи у регистратора домена по инструкции GitHub Pages.
4. Запушь изменения.

## Деплой на другие хостинги

Если GitHub Pages не подходит, сайт можно разместить на:

- Cloudflare Pages
- Vercel
- Netlify
- S3 + CloudFront

Достаточно загрузить содержимое папки `oblivion-blog/` (кроме `node_modules/` и `src/`).
