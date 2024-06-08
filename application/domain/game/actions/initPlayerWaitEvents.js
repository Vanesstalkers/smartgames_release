(function () {

  const player = this.players()[0];
  if(!player) return;

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

          game.run('putStartPlanes');

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
            lib.timers.timerRestart(game, { time: game.settings.timeToPlaceStartPlane });
            return { preventListenerRemove: true };
          }

          this.emit('RESET');
          game.run('startGame');
        },
      },
    },
    { defaultResetHandler: true, player }
  );

  return { status: 'ok' };
});
