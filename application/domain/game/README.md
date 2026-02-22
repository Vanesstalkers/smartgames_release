# domain/game

Доменная логика игры для release: наследник базового класса игры, корпоративные игры (команды, поля, кубики, карты), конфиги, actions, events и фронт.

## Ядро

- **class.js** — класс игры release: наследует `lib.game.class()`, подмешивает чат и колоду (`@hasDeck`), использует объекты из `domain.game._objects` (Bridge, Dice, Plane, Player, Table, Zone и др.). Методы раундов, таблицы, руки игроков.
- **User.js** — пользователь в контексте игры (расширение для домена).
- **Session.js** — сессия в контексте игры.

## Конфиги (configs/)

- **cards.js** — конфигурация карт.
- **games.js** — конфигурация типов игр.
- В `domain/lobby/start.js` дополняется `domain.game.configs.cardTemplates` (шаблоны карт из статики).

## corporate/ — корпоративные игры

Игры с командами, полями (planes), кубиками, портами и картами.

- **class.js** — класс корпоративной игры (наследник доменной игры), переопределение `playerJoin` и др.
- **classGame.js** — класс экземпляра корпоративной игры.
- **_objects/** — Player, Card, Dice, Plane, Table, Zone, ZoneSide, Port, Bridge и т.д.
- **actions/** — startGame, roundStart, roundEnd, roundSteps, putStartPlanes, putPlaneOnField, teamReady, changeTeamlead, addPlayer, removePlayer, fillGameData, endGame, работа с кубиками (rotateDice, replaceDice, deleteDice, restoreDice), мостами (removeBridge), полями (returnFieldToHand), broadcastRules/lobbySub и др.
- **events/card/** — обработчики карт (audit, claim, coffee, disease, dream, emergency, flowstate, give_project, insight, lib, pilot, refactoring, req_legal, req_tax, security, showoff, superman, take_project, teamlead, time, transfer, water, weekend, crutch и др.); часть дублируется в `events/card/` корня domain/game для общей логики.
- **events/common/** — putPlaneFromHand, gameProcess, diceReplacementEvent.
- **decorators/@chat.js** — декоратор чата для игры.
- **tutorial/** — competition, cooperative, finished — туториалы корпоративной игры.

## actions/ (уровень domain/game)

- **loadGame.js**, **roundStart.js**, **endGame.js**, **fillGameData.js**, **initPrepareGameEvents.js** — переопределения/расширения базовых действий игры. Для корпоративной игры loadGame восстанавливает супер-игру, команды и roundPool (подробнее: [Корпоративная игра](../lib/game/docs/game-corporate.md)).

## events/

- **card/** — общие обработчики карт (те же имена, что в corporate, для единой колоды и правил).
- **common/** — putPlaneFromHand, gameProcess, diceReplacementEvent.

## Фронт (front/)

- **Game.vue** — страница игры (переопределение lib).
- **corporateGame.vue** — страница корпоративной игры.
- **corporateGameGlobals.mjs**, **releaseGameGlobals.mjs** — глобалы для клиента.
- **router.mjs** — маршруты игры.
- **components/** — plane.vue, planeZone.vue, planeZoneSides.vue, planePort.vue, dice.vue, diceSideValueSelect.vue, card.vue, cardWorker.vue, bridge.vue, player.vue.

## tutorial/

- **start.js**, **links.js**, **getHelperLinks.js**, **restoreForced.js**, **gamePlane.js**, **gameControls.js**, **handPlanes.js**, **teamleadMenu.js** — шаги и сценарии туториала игры.

## Связи

- Наследует и расширяет `lib.game` (класс, API, объекты).
- Лобби инициализирует конфиг игрового сервера и при необходимости обращается к `domain.game.configs`.
