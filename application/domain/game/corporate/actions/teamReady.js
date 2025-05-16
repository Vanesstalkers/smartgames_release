(function ({ }, initPlayer) {
  const superGame = this.game();

  initPlayer.set({ eventData: { teamReady: true } });

  const games = superGame.getAllGames();
  for (const game of games) {
    const teamlead = game.select({ className: 'Player', attr: { teamlead: true } })[0];
    if (!teamlead?.eventData.teamReady) return; // "teamlead?" на случай, если не все игроки подключились
  }

  superGame.run('putStartPlanes');

  superGame.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });
  for (const game of games) {
    game.run('domain.initPrepareGameEvents');
  }
});
