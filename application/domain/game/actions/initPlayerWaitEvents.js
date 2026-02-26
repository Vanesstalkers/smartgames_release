(function () {
  this.initEvent(
    {
      name: 'initPlayerWaitEvents',
      init: function () {
        const { game, player } = this.eventContext();
        game.set({
          statusLabel: game.restorationMode ? `Восстановление игры` : 'Ожидание игроков',
          status: 'WAIT_FOR_PLAYERS',
        });
      },
      handlers: {
        PLAYER_JOIN: function ({ initPlayer: player }) {
          const { game } = this.eventContext();

          player.set({ ready: true });

          if (game.restorationMode) {
            const allPlayers = game.players({ readyOnly: false });
            const readyCount = allPlayers.filter((p) => p.ready).length;
            if (allPlayers.length - readyCount > 0) return { preventListenerRemove: true };
          } else if (game.getFreePlayerSlot()) {
            return { preventListenerRemove: true };
          }

          this.emit('RESET');

          if (game.restorationMode) return game.restart();

          game.run('initPrepareGameEvents', {}, player);
        },
      },
    },
    { publicHandlers: ['PLAYER_JOIN'] }
  );
});
