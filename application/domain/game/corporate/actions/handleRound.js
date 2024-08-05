(function ({} = {}, initPlayer) {
  const corporateGame = this.game();

  this.set({ roundReady: true });

  if (!corporateGame.allGamesRoundReady()) return;

  for (const game of corporateGame.getAllGames()) {
    game.runSuper('handleRound', {}, game.getActivePlayer());
    game.set({ roundReady: false });
  }

  corporateGame.dumpState();
});
