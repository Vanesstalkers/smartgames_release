(function ({ initPlayer } = {}) {
  if (!this.isCoreGame()) return;

  this.run('domain.startNewRound');
  const roundActiveGame = this.allGamesMerged() ? this.roundActiveGame() : null;

  for (const game of this.getAllGames()) {
    if (roundActiveGame && game !== roundActiveGame) continue;
    game.run('domain.startNewRound');
    game.set({ roundReady: false }); // активируем действия пользователя на фронте
  }
});
