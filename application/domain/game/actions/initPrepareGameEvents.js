(function () {
  const event = domain.game.events.common.putPlaneFromHand();

  event.init = function () {
    const { game, player } = this.eventContext();
    game.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });
    game.players()[0].activate();
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
    this.emit('CHECK_PLANES_IN_HANDS');
    return { preventListenerRemove: true };
  };

  event.handlers['PLAYER_TIMER_END'] = function () {
    this.emit('CHECK_PLANES_IN_HANDS');
    return { preventListenerRemove: true };
  };

  this.initEvent(event, { allowedPlayers: this.players() });
});
