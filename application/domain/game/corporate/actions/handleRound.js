(function () {
  const corporateGame = this.game();

  this.set({ roundReady: true });

  if (!corporateGame.allGamesRoundReady()) return;

  for (const game of corporateGame.getAllGames()) {
    game.run('domain.handleRound');
    game.set({ roundReady: false });
  }

  corporateGame.dumpState();
});
