(function () {
  this.initEvent({
    name: 'initPlayerWaitEvents',
    init: function () {
      const { game } = this.eventContext();
      const statusLabel = game.restorationMode ? `Восстановление игры` : 'Ожидание игроков';
      game.set({ statusLabel, status: 'WAIT_FOR_PLAYERS' });
      return { resetEvent: true };
    },
    handlers: {},
  });
});
