(function ({ winningPlayer, canceledByUser, message } = {}) {
  const superGame = this.game();
  superGame.run('lib.endGame', { winningPlayer, canceledByUser, customFinalize: true });

  for (const game of superGame.getAllGames()) {
    lib.timers.timerDelete(game);
    for (const player of game.players()) {
      player.set({ eventData: { plane: null } });
    }
  }

  superGame.checkCrutches();
  superGame.broadcastAction('gameFinished', {
    gameId: superGame.id(),
    gameType: superGame.deckType,
    playerEndGameStatus: superGame.playerEndGameStatus,
    fullPrice: superGame.gamesMap ? 0 : superGame.getFullPrice(),
    roundCount: superGame.round,
    crutchCount: superGame.crutchCount(),
  });

  throw new lib.game.endGameException();
});
