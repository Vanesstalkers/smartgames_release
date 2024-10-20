(function () {
  const event = domain.game.events.common.putPlaneFromHand();

  event.init = function () {
    const { game, player } = this.eventContext();
    const {
      settings: { planesAtStart, planesNeedToStart, planesToChoose, timeToPlaceStartPlane },
      restorationMode,
    } = game;

    const planesToBePlacedByPlayers = planesNeedToStart - planesAtStart;

    if (!restorationMode) {
      const players = game.players();
      const gamePlaneDeck = game.find('Deck[plane]');

      game.run('putStartPlanes');

      if (planesToBePlacedByPlayers > 0) {
        for (let i = 0; i < planesToBePlacedByPlayers; i++) {
          const player = players[i % players.length];
          const hand = player.find('Deck[plane]');
          for (let j = 0; j < planesToChoose; j++) {
            const plane = gamePlaneDeck.getRandomItem();
            if (plane) plane.moveToTarget(hand);
          }
        }

        game.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });
        game.getNextActivePlayer().activate(); // делаем строго после проверки actionsDisabled (внутри activate значение сбросится)
        lib.timers.timerRestart(game, { time: timeToPlaceStartPlane });

        return;
      }
    }

    game.run('startGame');
    return { removeEvent: true };
  };

  event.handlers['ADD_PLANE'] = function ({ target: plane }) {
    const { game, player } = this.eventContext();

    const gamePlaneDeck = game.find('Deck[plane]');
    const playerPlaneDeck = player.find('Deck[plane]');
    const planeList = playerPlaneDeck.getAllItems();

    if (!plane.eventData.moveToHand) {
      // один из новых блоков - остальные можно убрать
      const remainPlane = planeList.find(({ eventData: { moveToHand } }) => !moveToHand);
      if (remainPlane) {
        // в колоде мог остаться всего один блок на выбор
        remainPlane.moveToTarget(gamePlaneDeck);
      }
    }

    if (playerPlaneDeck.getAllItems().length) {
      // вернется в CHECK_PLANES_IN_HANDS
      return { preventListenerRemove: true };
    }

    const gamePlaneReady = game.decks.table.itemsCount() >= game.settings.planesNeedToStart;
    if (gamePlaneReady) {
      this.emit('RESET');
      game.run('startGame');
      return;
    }

    game.getActivePlayer().deactivate();
    const nextPlayer = game.players().find((player) => player.find('Deck[plane]').itemsCount() > 0);
    nextPlayer.activate();
    lib.timers.timerRestart(game, { time: game.settings.timeToPlaceStartPlane });

    return { preventListenerRemove: true };
  };

  event.handlers['END_ROUND'] = function () {
    const { game, player } = this.eventContext();
    game.logs({
      msg: `Блок игрового поля из руки {{player}} размещен автоматически.`,
      userId: player.userId,
    });
    this.emit('CHECK_PLANES_IN_HANDS');
    return { preventListenerRemove: true };
  };

  event.handlers['PLAYER_TIMER_END'] = function () {
    this.emit('END_ROUND');
    return { preventListenerRemove: true };
  };

  this.initEvent(event, { allowedPlayers: this.players() });
});
