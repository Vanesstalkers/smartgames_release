(function ({}, initPlayer) {
  const superGame = this.game();
  const games = superGame.getAllGames({ disabled: false });

  this.set({ eventData: { teamReady: true } });

  for (const game of games) {
    if (!game.eventData.teamReady) return;
  }

  if (superGame.restorationMode) return superGame.restart();

  superGame.run('putStartPlanes');

  superGame.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });
  for (const game of games) {
    game.run('domain.initPrepareGameEvents');
  }
});
