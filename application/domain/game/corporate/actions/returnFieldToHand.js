(function ({}, initPlayer) {
  const superGame = this.game();
  const currentTable = this.merged ? superGame.decks.table : this.decks.table;
  const playerDeck = initPlayer.find('Deck[plane]');
  const gamePlanes = currentTable.select({
    className: 'Plane',
    attr: { anchorGameId: this.id() },
  });

  for (const plane of gamePlanes) {
    plane.removeFromTable({ target: playerDeck });
    plane.set({ eventData: { moveToHand: true } });
    if (this.merged) plane.game(this);
  }

  this.set({ merged: null, roundReady: false });
  superGame.set({
    turnOrder: superGame.turnOrder.filter((gameId) => gameId !== this.id()),
  });

  // принципиально делать после set({ merged: null })
  const playersHands = this.players().map((p) => p.find('Deck[domino]'));
  const dices = this.find('Deck[domino_common]').items();
  for (let i = 0; i < dices.length; i++) {
    const dice = dices[i];
    dice.moveToTarget(playersHands[i % playersHands.length]); // внутри сработает markDelete
    dice.markNew();
  }

  const gameCommonCardDeck = this.find('Deck[card_common]');
  gameCommonCardDeck.moveAllItems({ target: initPlayer.find('Deck[card]'), markNew: true });

  this.roundActivePlayer(initPlayer);
  initPlayer.activate();

  const event = domain.game.events.common.putPlaneFromHand();
  this.initEvent(event, { allowedPlayers: [initPlayer] });
});
