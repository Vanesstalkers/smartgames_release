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

          if (game.restorationMode) return;

          if (game.getFreePlayerSlot()) return { preventListenerRemove: true };

          game.run('putStartPlanes');
        },
      },
    },
    { defaultResetHandler: true, allowedPlayers: this.players() }
  );
});
