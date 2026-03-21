(function ({ winningPlayer, canceledByUser, message } = {}) {
  this.run('lib.endGame', { winningPlayer, canceledByUser, customFinalize: true, message });

  this.checkCrutches();
  this.broadcastAction('gameFinished', {
    gameId: this.id(),
    gameCode: this.gameCode,
    playerEndGameStatus: this.playerEndGameStatus,
    gameAward: this.run('getGameAward'),
    roundCount: this.round,
    crutchCount: this.crutchCount(),
  });

  throw new lib.game.endGameException();
});
