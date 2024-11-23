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
          // PIPELINE_GAME_START (6.1) :: вызываем событие игры PLAYER_JOIN (проверка на getFreePlayerSlot)
          this.emit('RESET');
          game.run('initPrepareGameEvents');
        },
      },
    },
    { defaultResetHandler: true, allowedPlayers: this.players() }
  );
});
