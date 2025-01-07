(function () {
  if (!this.isCoreGame()) return this.run('domain.initPrepareGameEvents');

  const event = {
    init() {
      const { game, player } = this.eventContext();

      game.run('putStartPlanes');

      for (const plane of game.decks.table.items()) {
        plane.addCustomClass('core');
      }

      game.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });
      for (const childGame of game.getAllGames()) {
        childGame.run('domain.initPrepareGameEvents');
      }

      return { removeEvent: true };
    },
  };

  this.initEvent(event, { defaultResetHandler: true, allowedPlayers: this.players() });
});
