(function ({ }, initPlayer) {
  const superGame = this.game();

  initPlayer.set({ eventData: { teamReady: true } });

  const games = superGame.getAllGames();
  for (const game of games) {
    const teamlead = game.getTeamlead();
    if (!teamlead?.eventData.teamReady) return; // "teamlead?" на случай, если не все игроки подключились
  }

  if(superGame.restorationMode) return superGame.restart();

  superGame.run('putStartPlanes');

  superGame.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });
  for (const game of games) {
    game.run('domain.initPrepareGameEvents');
  }
});
