# Структура проекта release

Краткое описание назначения папок и ключевых файлов приложения **release** (игровая платформа SmartGames).

---

## Корень проекта

| Путь | Назначение |
|------|------------|
| `server.js` | Точка входа сервера (загрузка фреймворка [Impress](https://github.com/metarhia/impress)) |
| `package.json` | Зависимости и скрипты бэкенда (Node.js 16/18/19/20) |
| `README.md` | Инструкции по запуску для разработки и продакшена |
| `docs/` | Техническая документация (например, логика подключения игрока к игре) |
| `application/` | Код приложения Impress (бэкенд + общие модули для фронта) |
| `front/` | SPA на Vue 2 (клиентская часть) |
| `landing/` | Статические страницы лендинга (HTML + Markdown для Docsify) |

**Скрипты из корня репозитория (smartgames):**

- `npm run start-release-dev` — запуск сервера release с инспектором
- `npm run start-release-serve` — запуск dev-сервера фронта (порт 8082)
- Внутри release: `npm run buildAll` — полная сборка (front + backend), `npm run buildFront` — только фронт

---

## application/ — приложение Impress

Содержит конфигурацию, API, базы данных, общую библиотеку (`lib`) и доменную логику (`domain`). Часть файлов (Vue-компоненты, роутеры) подключается фронтом через алиас `~` → `application`.

### config/

| Файл | Назначение |
|------|------------|
| `server.js` | Настройки HTTP-сервера (порты, таймауты, CORS, воркеры) |
| `smartgames.js` | Код приложения (`appCode: 'release'`) |

### api/

Публичные API-обработчики. Например:

- `action.1/public.js` — публичные методы, вызываемые через `api.action`.

### db/

Подключение и обработчики хранилищ:

- `redis/` — Redis (start, handlers, hget)
- `mongo/` — MongoDB (start, handlers)

Используются для сессий, игр, пользователей и т.д.

### lib/ — общая библиотека

Переиспользуемая логика, не привязанная к одному домену. Подробнее о каждой папке:

| Путь | Назначение | Описание |
|------|------------|----------|
| `lib/store/` | Базовые классы хранилища (store), общие для игр и лобби | [README](application/lib/store/README.md) |
| `lib/game/` | Базовый класс игры, API игры (join, enter, leave, new, restore, cards, action), объекты (Player и др.), фронт (Game.vue, глобалы, события мыши) | [README](application/lib/game/README.md) |
| `lib/lobby/` | Класс лобби, API (enter, exit, logout, checkGame), фронт (Lobby.vue, game-item, games, profile, rules, rankings, gallery, AuthForm, tutorial-games), туториалы | [README](application/lib/lobby/README.md) |
| `lib/user/` | Класс пользователя, сессия, API (initSession, update, generateAvatar) | [README](application/lib/user/README.md) |
| `lib/helper/` | Хелпер (Vue-компоненты, диалоги), API (restoreLinks), туториалы, документация (alert-list, helper-link) | [README](application/lib/helper/README.md) |

Файлы с суффиксом `front/` — Vue-компоненты, роутеры (`router.mjs`), события — подхватываются фронтом из `front/src` (например, роутер подгружает все `router.mjs` из `application`).

### domain/ — доменная логика

Специфика конкретных доменов; может переопределять и расширять `lib`. Подробнее о каждой папке:

| Путь | Назначение | Описание |
|------|------------|----------|
| `domain/game/` | Домен игры: базовый класс игры, corporate-игры (класс, класс игры, actions, events, декораторы, туториалы), конфиги (cards, games), actions (loadGame, roundStart, endGame, fillGameData и др.), events (карты, общие), фронт (Game.vue, corporateGame.vue, компоненты: plane, card, dice, bridge и т.д., роутер, глобалы) | [README](application/domain/game/README.md) |
| `domain/lobby/` | Домен лобби: переопределения фронта (Lobby.vue), start | [README](application/domain/lobby/README.md) |
| `domain/user/` | Домен пользователя: Session, Class | [README](application/domain/user/README.md) |

Иерархия: в `lib` — базовые классы и API; в `domain/game` — наследники и специфика игр (в т.ч. corporate), карты, поля, кубики и т.д.

---

## front/ — Vue 2 SPA

Клиентское приложение на Vue CLI.

| Путь | Назначение |
|------|------------|
| `src/main.js` | Точка входа: Vue, Vuex, роутер, подключение к API/WebSocket, глобальные события (например, joinGame) |
| `src/App.vue` | Корневой компонент |
| `src/router/index.js` | Роутер: автоматически подключает маршруты из всех `application/**/router.mjs` |
| `src/mixins.scss` | Общие стили/миксины |
| `vue.config.js` | Алиас `~` → `../application`; `publicPath`: в dev — `/`, в prod — `/release/` |

Сборка: `npm run build` (prod), `npm run build-dev` (dev). Сервер разработки: порт 8082.

Роуты и многие компоненты страниц физически лежат в `application/` (lib и domain), а не в `front/src`, и подключаются за счёт алиаса `~`.

---

## landing/

Статические страницы и контент лендинга (формат Docsify):

- `index.html`, `_coverpage.md`, `_navbar.md`, `_sidebar.md`
- Тексты: `introduction.md`, `rules.md`, `prices.md`, `contacts.md` и т.д.

---

## Дополнительно

- **Типы:** в корне release в `package.json` указано `"types": "types/global.d.ts"` — общие типы для Node-части.
- **Тесты:** скрипт `npm run test` запускает lint, types и `node test/system.js`.
- **Стиль и линт:** ESLint (в т.ч. metarhia), Prettier; скрипты `lint`, `fmt` в `release/package.json`.
- **Документация по потокам:** в [application/lib/game/docs/game-process.md](application/lib/game/docs/game-process.md) описан процесс подключения игрока к игре и жизненный цикл игры (фронт ↔ бэкенд, join/enter, corporate).

При необходимости расширить описание — можно добавить в этот файл подразделы по конкретным модулям (например, `lib/game`, `domain/game/corporate`) или по сценариям (создание игры, раунд, карты).
