# domain/lobby

Доменная логика лобби для release: настройка игрового сервера, URL, шаблоны карт и переопределения UI лобби.

## Структура

- **start.js** — инициализация при старте приложения:
  - Установка `lib.lobby.__gameServerConfig`: код `release`, заголовок «Релиз», иконка, активность, URL фронта (localhost:8082 или smartgames.studio/release), serverUrl для API, объект games (заполняется позже).
  - Установка `lib.lobby.__tutorialImgPrefix` (пусто в dev, `/${code}` в prod).
  - Загрузка списка шаблонов карт из `application/static/img/cards` в `domain.game.configs.cardTemplates`.
  - На воркере W1 — подключение к Redis и логика подключения к лобби (`connectToLobby` и т.д.).

- **front/Lobby.vue** — переопределение главной страницы лобби (вместо `lib/lobby/front/Lobby.vue`).

- **front/router.mjs** — маршруты, специфичные для домена лобби (подхватываются `front/src/router/index.js`).

## Связи

- Использует `lib.lobby` (класс, API, остальной фронт) и задаёт его глобальные настройки (`__gameServerConfig`, `__tutorialImgPrefix`).
- Дополняет `domain.game.configs` шаблонами карт.
