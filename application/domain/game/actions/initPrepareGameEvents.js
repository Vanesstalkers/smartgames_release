(function () {
  this.initEvent(
    {
      init: function () {
        const { game, player } = this.eventContext();
        game.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });
      },
      handlers: {
        ADD_PLANE: function () {
          const { game, player } = this.eventContext();

          const gamePlaneDeck = game.find('Deck[plane]');
          const playerPlaneDeck = player.find('Deck[plane]');
          const planeList = playerPlaneDeck.select('Plane');
          for (const plane of planeList) plane.moveToTarget(gamePlaneDeck);

          const gamePlaneReady = Object.keys(game.planeMap).length >= game.settings.planesNeedToStart;
          if (gamePlaneReady) {
            this.emit('RESET');
            game.run('startGame');
            return;
          }

          game.changeActivePlayer();
          this.player(game.getActivePlayer()); // чтобы пройти player-access проверку в toggleEventHandlers
          lib.timers.timerRestart(game, { time: 10 });
          return { preventListenerRemove: true };
        },
        NO_AVAILABLE_PORTS: function ({ joinPlane }) {
          const { game, player } = this.eventContext();
          const playerPlaneDeck = player.find('Deck[plane]');

          playerPlaneDeck.removeItem(joinPlane);
          if (Object.keys(game.planeMap).length === 0) {
            // размещается первый plane на пустое поле
            game.addPlane(joinPlane);
            return { preventListenerRemove: true };
          } else {
            const gamePlaneDeck = game.find('Deck[plane]');
            const planeList = playerPlaneDeck.select('Plane');
            for (const plane of planeList) plane.moveToTarget(gamePlaneDeck);

            this.emit('RESET');
            game.run('startGame');
          }
        },
        PLAYER_TIMER_END: function () {
          const { game, player } = this.eventContext();

          const planeDeck = player.find('Deck[plane]');
          const plane = planeDeck.select('Plane')[0];
          if (plane) game.run('showPlanePortsAvailability', { joinPlaneId: plane._id });

          const availablePortConfig = game.availablePorts[0];
          if (availablePortConfig) game.run('putPlaneOnField', availablePortConfig);
        },
      },
    },
    {
      defaultResetHandler: true,
      player: this.getActivePlayer(),
    }
  );
  return { status: 'ok' };
});
