# Логика подключения игрока к игре

## Обзор процесса

Процесс подключения игрока к игре состоит из нескольких этапов, которые происходят как на фронтенде, так и на бэкенде.

## Фронтенд (клиентская часть)

### 1. Инициация подключения

**Файл:** [`application/lib/lobby/front/components/game-item.vue`](application/lib/lobby/front/components/game-item.vue)

Пользователь нажимает кнопку "Присоединиться" в списке игр. Компонент `game-item` эмитит событие `join` с данными:

```javascript
{
  gameId: game.id,
  gameCode: game.gameCode,
  gameType: game.gameType  // опционально
}
```

### 2. Обработка события подключения

**Файл:** [`application/lib/lobby/front/components/games.vue`](application/lib/lobby/front/components/games.vue)

Метод `joinGame()` обрабатывает событие подключения:

1. **Проверка активности игры:**
   - Вызывается `lobby.api.checkGame` для проверки, что игровой сервер активен
   - Если игра не активна, подключение отменяется

2. **Вызов API подключения:**
   - Вызывается `game.api.join` с параметрами: `{ gameId, viewerMode, teamId }`
   - После успешного вызова API перенаправление происходит автоматически через событие `joinGame` от сервера

### 3. Обработка события joinGame

**Файл:** [`application/lib/lobby/front/components/games.vue`](application/lib/lobby/front/components/games.vue) (метод `created()`)

Устанавливается обработчик события `state.emit.joinGame`, который:
- Получает данные: `{ gameCode, gameType, gameId }`
- Выполняет перенаправление на страницу игры через `app.$router.push()`

**Файл:** [`front/src/main.js`](front/src/main.js)

Событие `joinGame` приходит через WebSocket от сервера:
- `session.emit('joinGame', ...)` на сервере отправляет событие через `api.action.on('emit')`
- Обработчик вызывает `state.emit.joinGame(data)`

## Бэкенд (серверная часть)

### 1. API endpoint: game.api.join

**Файл:** [`application/lib/game/api/join.js`](application/lib/game/api/join.js)

Основной метод подключения к игре:

1. **Проверка текущего состояния:**
   - Проверяет, не подключен ли пользователь к другой игре
   - Если подключен к другой игре, возвращает ошибку

2. **Установка gameId для сессий:**
   - Устанавливает `gameId` для всех сессий пользователя
   - Это делается заранее на случай повторного вызова API

3. **Вызов метода игры:**
   - Вызывает `game.playerJoin(data)` или `game.viewerJoin(data)` в зависимости от режима
   - Передает данные: `{ userId, userName, ...args }`

### 2. Метод игры: game.playerJoin

**Файл:** [`application/lib/game/class.js`](application/lib/game/class.js) (базовый класс)
**Файл:** [`application/domain/game/corporate/class.js`](application/domain/game/corporate/class.js) (для corporate-игр)
**Файл:** [`application/domain/game/poker/class.js`](application/domain/game/poker/class.js) (для poker-игр)

#### Базовый класс (lib/game/class.js):

1. **Проверка статуса игры:**
   - Проверяет, что игра не завершена (`status !== 'FINISHED'`)

2. **Поиск или создание игрока:**
   - Если передан `playerId`, использует существующего игрока
   - Иначе получает свободный слот через `getFreePlayerSlot()`

3. **Установка данных игрока:**
   - Устанавливает `userId`, `userName`, `avatarCode`

4. **Вызов user.joinGame():**
   - **ВАЖНО:** Вызывает `user.joinGame()` для установки `user.gameId`
   - Передает: `{ gameId, playerId, gameCode, gameType }`

5. **Обработка событий:**
   - Вызывает `toggleEventHandlers('PLAYER_JOIN')`
   - Если игра с ИИ, создает игрока-компьютер

6. **Сохранение изменений:**
   - Вызывает `game.saveChanges()`

#### Corporate класс (domain/game/corporate/class.js):

Переопределяет `playerJoin` для поддержки команд:

1. **Поиск игрока:**
   - Проверяет, есть ли восстановленный игрок
   - Иначе получает свободный слот для указанной команды

2. **Вызов user.joinGame():**
   - **КРИТИЧНО:** Должен вызывать `user.joinGame()` для установки `user.gameId`
   - Без этого вызова `user.gameId` останется `undefined`, что приведет к ошибке при входе в игру

3. **Публикация события:**
   - Публикует событие `joinGame` через broadcaster для фронтенда

### 3. Метод пользователя: user.joinGame

**Файл:** [`application/lib/game/User.js`](application/lib/game/User.js)

Устанавливает связь пользователя с игрой:

1. **Обработка туториалов:**
   - Сбрасывает текущий туториал
   - Если нужно, запускает туториал начала игры

2. **Установка данных:**
   - Устанавливает `gameId`, `playerId`, `viewerId` в объект пользователя
   - Инициализирует рейтинги для игры, если их еще нет

3. **Сохранение изменений:**
   - Вызывает `user.saveChanges()` для сохранения в БД
   - **ВАЖНО:** Это асинхронная операция, которая может занять время

4. **Обновление сессий:**
   - Для каждой сессии пользователя:
     - Устанавливает `gameId`, `playerId`, `viewerId`
     - Сохраняет изменения сессии
     - Эмитит событие `joinGame` для фронтенда

### 4. API endpoint: game.api.enter

**Файл:** [`application/lib/game/api/enter.js`](application/lib/game/api/enter.js)

Вызывается при загрузке страницы игры:

1. **Проверка участия:**
   - **КРИТИЧНО:** Проверяет, что `gameId === user.gameId`
   - Если не совпадает, выбрасывает ошибку "Пользователь не участвует в игре"
   - Эта проверка требует, чтобы `user.gameId` был установлен в `user.joinGame()`

2. **Проверка существования игры:**
   - Проверяет, что игра существует в Redis
   - Если игры нет, очищает `user.gameId` и выбрасывает ошибку

3. **Подписка на события:**
   - Игра подписывается на события пользователя: `game.subscribe('user-${userId}')`
   - Пользователь подписывается на события игры: `user.subscribe('game-${gameId}')`
   - Сессия подписывается на события игры для Vue store

4. **Возврат данных:**
   - Возвращает `{ gameId, playerId, viewerId }` для инициализации фронтенда

## Критические моменты

### Проблема с corporate играми

В `corporate/class.js` метод `playerJoin` был переопределен без вызова `user.joinGame()`. Это приводило к тому, что:
- `user.gameId` оставался `undefined`
- При вызове `game.api.enter` возникала ошибка "Пользователь не участвует в игре"

**Решение:** Добавлен вызов `user.joinGame()` в `corporate.playerJoin()` перед публикацией события.

### Тайминг и асинхронность

1. **Порядок операций:**
   ```
   game.api.join()
     → game.playerJoin()
       → user.joinGame()
         → user.saveChanges()  // асинхронная операция
         → session.emit('joinGame')  // событие для фронтенда
   ```

3. **Проверка в game.api.enter:**
   - Должна происходить ПОСЛЕ того, как `user.gameId` сохранен в БД
   - Иначе проверка `gameId === user.gameId` не пройдет

## Схема потока данных

```
[Фронтенд]
  game-item.vue
    ↓ emit('join', { gameId, gameCode })
  games.vue.joinGame()
    ↓ api.action.call('game.api.join')
    
[Бэкенд]
  game.api.join()
    ↓ game.playerJoin()
      ↓ user.joinGame()
        ↓ user.saveChanges()  // сохранение в БД
        ↓ session.emit('joinGame')  // событие для фронтенда
    
[Фронтенд]
  api.action.on('emit')
    ↓ state.emit.joinGame()
      ↓ app.$router.push('/game/...')
        ↓ Game.vue.mounted()
          ↓ game.api.enter()
            
[Бэкенд]
  game.api.enter()
    ↓ проверка: gameId === user.gameId
    ↓ подписка на события
    ↓ возврат данных
```

## Файлы, участвующие в процессе

### Фронтенд:
- [`application/lib/lobby/front/components/game-item.vue`](application/lib/lobby/front/components/game-item.vue) - кнопка подключения
- [`application/lib/lobby/front/components/games.vue`](application/lib/lobby/front/components/games.vue) - обработка подключения
- [`front/src/main.js`](front/src/main.js) - обработка событий от сервера
- [`application/lib/game/front/Game.vue`](application/lib/game/front/Game.vue) - страница игры

### Бэкенд:
- [`application/lib/game/api/join.js`](application/lib/game/api/join.js) - API подключения
- [`application/lib/game/api/enter.js`](application/lib/game/api/enter.js) - API входа в игру
- [`application/lib/game/class.js`](application/lib/game/class.js) - базовый класс игры (playerJoin)
- [`application/domain/game/corporate/class.js`](application/domain/game/corporate/class.js) - класс corporate игры (playerJoin)
- [`application/lib/game/User.js`](application/lib/game/User.js) - класс пользователя (joinGame)

## Отладка

Для отладки процесса подключения добавлено логирование с префиксами:
- `[game.api.join]` - логи API подключения
- `[game.api.enter]` - логи API входа
- `[game.playerJoin]` - логи метода игры
- `[corporate.playerJoin]` - логи corporate игры
- `[user.joinGame]` - логи метода пользователя

Все логи используют `console.debug()` для отладочной информации.
