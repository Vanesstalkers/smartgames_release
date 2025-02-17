(function () {
  const {
    data,
    handlers: {
      //
      NO_AVAILABLE_PORTS,
      TRIGGER,
      TRIGGER_EXTRA_PLANE,
      CHECK_PLANES_IN_HANDS,
    },
  } = domain.game.events.common.putPlaneFromHand();

  const event = this.initEvent(
    {
      data,
      initPrepareStartFieldStep() {
        const { game } = this.eventContext();
        const deck = game.find('Deck[plane]');

        const player = game.selectNextActivePlayer();
        const hand = player.find('Deck[plane]');

        for (let j = 0; j < game.settings.planesToChoose; j++) {
          const plane = deck.getRandomItem();
          if (plane) plane.moveToTarget(hand);
        }

        player.activate();
        lib.timers.timerRestart(game, { time: game.settings.timeToPlaceStartPlane });
      },
      init() {
        const { game } = this.eventContext();
        const {
          settings: { planesAtStart, planesNeedToStart, timeToPlaceStartPlane },
        } = game;

        game.run('putStartPlanes');

        if (planesNeedToStart <= planesAtStart) {
          this.destroy(); // RESET возвращает добавленные в руку plane-ы, которых в этом случае нет
          game.run('startGame');
          return;
        }

        game.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });

        this.initPrepareStartFieldStep();
      },
      handlers: {
        NO_AVAILABLE_PORTS,
        TRIGGER,
        TRIGGER_EXTRA_PLANE,
        CHECK_PLANES_IN_HANDS,
        ADD_PLANE({ target: plane }) {
          const { game } = this.eventContext();
          const deck = game.find('Deck[plane]');
          const player = game.roundActivePlayer();
          const hand = player.find('Deck[plane]');
          const handPlanes = hand.getAllItems();

          if (!plane.eventData.moveToHand && !plane.eventData.extraPlane) {
            // один из блоков для размещения на выбор - остальные можно убрать
            const planes = handPlanes.filter(({ eventData: { moveToHand, extraPlane } }) => !moveToHand && !extraPlane);
            for (const plane of planes) plane.moveToTarget(deck);
          }

          if (plane.eventData.extraPlane) {
            plane.set({ eventData: { extraPlane: null } });

            // дополнительные блоки не обязательны к размещению - убираем из руки, чтобы не мешались
            const planes = handPlanes.filter((plane) => plane.eventData.extraPlane);
            for (const plane of planes) {
              plane.moveToTarget(deck);
              plane.set({ eventData: { extraPlane: null } });
            }
          }

          const remainPlanes = hand.getAllItems().find((plane) => !plane.eventData.extraPlane);
          if (remainPlanes) {
            // еще остались обязательные к размещению блоки
            this.emit('NO_AVAILABLE_PORTS');
            return { preventListenerRemove: true };
          }

          player.deactivate();
          player.set({ eventData: { showNoAvailablePortsBtn: null, fakePlaneAddBtn: null } });
          hand.moveAllItems({ target: deck });
          hand.updateAllItems({
            eventData: { selectable: null, moveToHand: null, extraPlane: null },
          });

          if (game.settings.planesNeedToStart > game.decks.table.itemsCount()) {
            this.initPrepareStartFieldStep();
            return { preventListenerRemove: true };
          }

          this.emit('RESET');

          game.run('startGame');
          return { preventListenerRemove: true }; // без этого удалится обработчик ADD_PLANE из startGame
        },
        // глобальный PLAYER_TIMER_END появится только в initGameProcessEvents
        PLAYER_TIMER_END() {
          this.emit('END_ROUND');
          return { preventListenerRemove: true };
        },
        END_ROUND() {
          const { game, player } = this.eventContext();

          if (game.status === 'FINISHED') return; // чтобы ошибка не зациклилась, если возникли проблемы с выкладыванием стартовых блоков

          game.logs({
            msg: `Блок игрового поля из руки {{player}} размещен автоматически.`,
            userId: player.userId,
          });
          this.emit('CHECK_PLANES_IN_HANDS');
          return { preventListenerRemove: true };
        },
        RESET() {
          const { game } = this.eventContext();
          const deck = game.find('Deck[plane]');

          game.decks.table.updateAllItems({
            eventData: { selectable: null, moveToHand: null, extraPlane: null },
          });

          for (const player of game.players()) {
            const hand = player.find('Deck[plane]');
            hand.updateAllItems({
              eventData: { selectable: null, moveToHand: null, extraPlane: null },
            });
            hand.moveAllItems({ target: deck });
          }

          for (const player of game.players()) {
            player.removeEventWithTriggerListener();
          }
          this.destroy();
        },
      },
    },
    { allowedPlayers: this.players() }
  );

  for (const player of this.players()) {
    player.setEventWithTriggerListener(event);
  }
  // const eventTemplate = domain.game.events.common.putPlaneFromHand();

  // eventTemplate.init = function () {
  //   const { game, source } = this.eventContext();
  //   const {
  //     settings: { planesAtStart, planesNeedToStart, planesToChoose, timeToPlaceStartPlane },
  //   } = game;

  //   const planesToBePlacedByPlayers = planesNeedToStart - planesAtStart;
  //   const players = game.players();
  //   const gamePlaneDeck = game.find('Deck[plane]');

  //   game.run('putStartPlanes');

  //   if (!planesToBePlacedByPlayers) {
  //     this.destroy(); // RESET возвращает добавленные в руку plane-ы, которых в этом случае нет
  //     game.run('startGame');
  //     return;
  //   }

  //   for (let i = 0; i < planesToBePlacedByPlayers; i++) {
  //     const player = players[i % players.length];
  //     const hand = player.find('Deck[plane]');
  //     for (let j = 0; j < planesToChoose; j++) {
  //       const plane = gamePlaneDeck.getRandomItem();
  //       if (plane) plane.moveToTarget(hand);
  //     }
  //   }

  //   game.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });
  //   game.selectNextActivePlayer().activate();
  //   lib.timers.timerRestart(game, { time: timeToPlaceStartPlane });
  // };

  // eventTemplate.handlers['ADD_PLANE'] = function ({ target: plane }) {
  //   const { game, player } = this.eventContext();

  //   const gamePlaneDeck = game.find('Deck[plane]');
  //   const playerPlaneDeck = player.find('Deck[plane]');
  //   const planeList = playerPlaneDeck.getAllItems();

  //   if (plane.eventData.extraPlane) {
  //     const extraPlanes = planeList.filter((plane) => plane.eventData.extraPlane);
  //     if (extraPlanes.length) {
  //       for (const plane of extraPlanes) {
  //         plane.moveToTarget(gamePlaneDeck);
  //       }
  //     }
  //   } else if (!plane.eventData.moveToHand) {
  //     // один из новых блоков для размещения на выбор - остальные можно убрать
  //     const remainPlane = planeList.find(() => !plane.eventData.moveToHand);
  //     if (remainPlane) {
  //       // в колоде мог остаться всего один блок на выбор
  //       remainPlane.moveToTarget(gamePlaneDeck);
  //     }
  //   }

  //   const gamePlaneReady = game.decks.table.itemsCount() >= game.settings.planesNeedToStart;
  //   if (!gamePlaneReady) {
  //     game.roundActivePlayer().deactivate();
  //     const nextPlayer = game.players().find((player) => player.find('Deck[plane]').itemsCount() > 0);
  //     nextPlayer.activate();
  //     game.roundActivePlayer(nextPlayer);
  //     lib.timers.timerRestart(game, { time: game.settings.timeToPlaceStartPlane });
  //     return { preventListenerRemove: true };
  //   }

  //   this.emit('RESET');
  //   game.run('startGame');
  //   return { preventListenerRemove: true }; // без этого удалится обработчик ADD_PLANE из startGame
  // };

  // eventTemplate.handlers['END_ROUND'] = function () {
  //   const { game, player } = this.eventContext();
  //   game.logs({
  //     msg: `Блок игрового поля из руки {{player}} размещен автоматически.`,
  //     userId: player.userId,
  //   });
  //   this.emit('CHECK_PLANES_IN_HANDS');
  //   return { preventListenerRemove: true };
  // };

  // eventTemplate.handlers['PLAYER_TIMER_END'] = function () {
  //   this.emit('END_ROUND');
  //   return { preventListenerRemove: true };
  // };

  // eventTemplate.handlers['RESET'] = function () {
  //   const { game } = this.eventContext();
  //   const gameDeck = game.find('Deck[plane]');

  //   for (const player of game.players()) {
  //     // playerPlaneDeck.updateAllItems({
  //     //   eventData: { selectable: null, moveToHand: null, extraPlane: null },
  //     // });
  //     const playerPlaneDeck = player.find('Deck[plane]');
  //     playerPlaneDeck.moveAllItems({ target: gameDeck });
  //   }

  //   for (const player of game.players()) {
  //     player.removeEventWithTriggerListener();
  //   }
  //   this.destroy();
  // };

  // const event = this.initEvent(eventTemplate, { allowedPlayers: this.players() });
  // for (const player of this.players()) {
  //   player.setEventWithTriggerListener(event);
  // }
});
