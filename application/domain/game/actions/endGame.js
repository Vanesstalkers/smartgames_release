(function ({ winningPlayer, canceledByUser } = {}) {
  this.runSuper('endGame', { winningPlayer, canceledByUser, customFinalize: true });

  this.checkCrutches();
  this.broadcastAction('gameFinished', {
    gameId: this.id(),
    gameType: this.deckType,
    playerEndGameStatus: this.playerEndGameStatus,
    fullPrice: this.getFullPrice(),
    roundCount: this.round,
    crutchCount: this.crutchCount(),
  });

  throw new lib.game.endGameException();
});
