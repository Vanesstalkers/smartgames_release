(function ({ initPlayer } = {}) {
  if (!this.isCoreGame()) return;

  this.run('domain.startNewRound');

  for (const game of this.getAllGames()) {
    game.run('domain.startNewRound');
    game.set({ roundReady: false }); // активируем действия пользователя на фронте
  }
});
