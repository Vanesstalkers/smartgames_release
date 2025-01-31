(function ({ transferBack }, initPlayer) {
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
  }

  this.set({
    merged: null,
    forcedNextActivePlayerId: this.roundActivePlayer() !== initPlayer ? initPlayer.id() : null,
  });

  const event = domain.game.events.common.putPlaneFromHand();
  this.initEvent(event, { allowedPlayers: [initPlayer] });

  // ??? что будет с общей рукой
  // !!!! проверить инициацию сброса разными игроками с разным порядком хода + автоматический сброс при отсутствии доступных портов для merge
  // !!!! муляж plane для добавления в руку дополнительных блоков
});
