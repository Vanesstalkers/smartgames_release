(function () {
  if (!this.isCoreGame()) return this.run('domain.initPrepareGameEvents');

  const event = {
    name: 'initPrepareGameEvents',
    init() {
      const { game, player } = this.eventContext();

      game.run('putStartPlanes');

      game.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });
      for (const childGame of game.getAllGames()) {
        childGame.run('domain.initPrepareGameEvents');
      }

      return { resetEvent: true };
    },
  };

  this.initEvent(event, { allowedPlayers: this.players() });
});
