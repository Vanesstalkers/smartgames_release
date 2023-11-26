(function () {
  this.initEvent(
    {
      init: function () {
        const { game, player } = this.eventContext();
        game.set({ statusLabel: 'Ожидание игроков', status: 'WAIT_FOR_PLAYERS' });
      },
      handlers: {
        PLAYER_JOIN: function () {
          const { game, player } = this.eventContext();

          if (game.getFreePlayerSlot()) return { preventListenerRemove: true };

          const {
            settings: { planesAtStart, planesNeedToStart, planesToChoose },
          } = game;
          const players = game.players();

          const gamePlaneDeck = game.find('Deck[plane]');
          const skipArray = [];
          for (let i = 0; i < planesAtStart; i++) {
            const plane = gamePlaneDeck.getRandomItem({ skipArray });
            if (plane) {
              skipArray.push(plane.id());
              if (i === 0) {
                // игровое поле пустое
                gamePlaneDeck.removeItem(plane);
                game.addPlane(plane);
              } else {
                game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() });
                if (game.availablePorts.length === 0) continue;

                const availablePortConfig = game.availablePorts[Math.floor(Math.random() * game.availablePorts.length)];
                game.run('putPlaneOnField', availablePortConfig);
              }
            } else {
              i = planesAtStart;
            }
          }

          const planesToBePlacedByPlayers = planesNeedToStart - planesAtStart;
          for (let i = 0; i < planesToBePlacedByPlayers; i++) {
            const player = players[i % players.length];
            const hand = player.find('Deck[plane]');
            for (let j = 0; j < planesToChoose; j++) {
              const plane = gamePlaneDeck.getRandomItem();
              if (plane) plane.moveToTarget(hand);
            }
          }

          game.run('initPrepareGameEvents');

          if (planesToBePlacedByPlayers > 0) {
            lib.timers.timerRestart(game, { time: 10 });
            return { preventListenerRemove: true };
          }

          this.emit('RESET');
          game.run('startGame');
        },
      },
    },
    {
      defaultResetHandler: true,
      player: this.players()[0],
    }
  );

  return { status: 'ok' };
});
