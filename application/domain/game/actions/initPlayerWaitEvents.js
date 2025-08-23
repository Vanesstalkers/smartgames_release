(function () {
  this.initEvent(
    {
      name: 'initPlayerWaitEvents',
      init: function () {
        const { game, player } = this.eventContext();
        game.set({ statusLabel: 'Ожидание игроков', status: 'WAIT_FOR_PLAYERS' });
      },
      handlers: {
        PLAYER_JOIN: function ({ initPlayer: player }) {
          const { game } = this.eventContext();

          player.set({ ready: true });

          if (game.getFreePlayerSlot()) return { preventListenerRemove: true };

          this.emit('RESET');

          if (game.restorationMode) return game.restart();

          game.run('initPrepareGameEvents', {}, player);
        },
      },
    },
    { publicHandlers: ['PLAYER_JOIN'] }
  );
});
