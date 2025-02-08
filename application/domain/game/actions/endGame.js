(function ({ winningPlayer, canceledByUser, message } = {}) {
  this.run('lib.endGame', { winningPlayer, canceledByUser, customFinalize: true, message });

  // игра может завершиться после автодобавления новых plane, алгоритм которого навешивает соответствующие атрибуты
  this.decks.table.updateAllItems({
    eventData: { selectable: null, moveToHand: null, extraPlane: null },
  });

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
