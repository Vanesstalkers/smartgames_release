(function ({ winningPlayer, canceledByUser, message } = {}) {
  this.run('lib.endGame', { winningPlayer, canceledByUser, customFinalize: true, message });

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
