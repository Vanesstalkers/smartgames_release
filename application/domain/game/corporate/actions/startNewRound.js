(function ({ initPlayer } = {}) {
  if (!this.isCoreGame()) return;

  const newRoundNumber = this.round + 1;
  this.set({ statusLabel: `Раунд ${newRoundNumber}`, round: newRoundNumber });
  const roundActiveGame = this.selectNextActiveGame();
  const allGamesMerged = this.allGamesMerged();

  for (const game of this.getAllGames()) {
    if (allGamesMerged && roundActiveGame && game !== roundActiveGame) {
      game.dumpState();
      continue;
    }
    game.set({ roundReady: false }); // активируем действия пользователя на фронте (вызываем до startNewRound, чтобы попало в dumpState)
    game.run('domain.startNewRound');
  }

  this.dumpState();
});
