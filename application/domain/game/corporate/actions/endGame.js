(function ({ winningPlayer, canceledByUser } = {}) {
  this.runSuper('endGame', { winningPlayer, canceledByUser, customFinalize: true });

  for (const game of Object.values(this.store.game)) {
    game.decks.table.updateAllItems({
      eventData: { selectable: null, moveToHand: null },
    });
    try {
      game.runSuper('endGame', { winningPlayer, canceledByUser, customFinalize: true });
    } catch (exception) {
      if (exception instanceof lib.game.endGameException) {
      } else throw exception;
    }
  }

  this.checkCrutches();
  this.broadcastAction('gameFinished', {
    gameId: this.id(),
    gameType: this.deckType,
    playerEndGameStatus: this.playerEndGameStatus,
    fullPrice: this.gamesMap ? 0 : this.getFullPrice(),
    roundCount: this.round,
    crutchCount: this.crutchCount(),
  });

  throw new lib.game.endGameException();
});
