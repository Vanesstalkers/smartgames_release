(function ({ resetActivePlayer } = {}) {
  const corporateGame = this.game();

  this.set({ roundReady: true });

  if (!corporateGame.allGamesRoundReady()) return;

  for (const game of corporateGame.getAllGames()) {
    game.runSuper('endRound', { resetActivePlayer });
    game.set({ roundReady: false });
  }

  corporateGame.dumpState();
});
