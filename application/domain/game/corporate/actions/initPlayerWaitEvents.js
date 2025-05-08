(function () {
  this.initEvent(
    {
      name: 'initPlayerWaitEvents',
      init: function () {
        const { game, player } = this.eventContext();
        const status = game.restorationMode ? 'RESTORING_GAME' : 'WAIT_FOR_PLAYERS';
        game.set({ status, statusLabel: 'Ожидание игроков' });
      },
      handlers: {
        PLAYER_JOIN: function () {
          const { game, player } = this.eventContext();

          if (game.getFreePlayerSlot()) return { preventListenerRemove: true };

          this.emit('RESET');

          if (game.restorationMode) return game.restore();

          game.run('initPrepareGameEvents');
        },
      },
    },
    { allowedPlayers: this.players() }
  );
});
