(function ({}, initPlayer) {
  const superGame = this.game();
  const currentTable = this.merged ? superGame.decks.table : this.decks.table;
  const playerDeck = initPlayer.find('Deck[plane]');
  const gamePlanes = currentTable.select({
    className: 'Plane',
    attr: { sourceGameId: this.id() },
  });

  for (const plane of gamePlanes) {
    if (this.merged) plane.game(this);
    plane.removeFromTable({ target: playerDeck });
    plane.set({ eventData: { moveToHand: true } });
  }

  this.set({ merged: null, roundReady: null });
  superGame.set({
    turnOrder: superGame.turnOrder.filter((gameId) => gameId !== this.id()),
  });
  
  this.roundActivePlayer(initPlayer);
  initPlayer.activate();

  const event = domain.game.events.common.putPlaneFromHand();
  this.initEvent(event, { allowedPlayers: [initPlayer] });

  // !!!! не работает восстановление второй смердженной игры (из-за кривого дампа)
  // ??? что будет с общей рукой
  // !!!! проверить инициацию сброса разными игроками с разным порядком хода + автоматический сброс при отсутствии доступных портов для merge
  // !!!! муляж plane для добавления в руку дополнительных блоков
});
