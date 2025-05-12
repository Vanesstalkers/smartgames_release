(function ({ }) {

  const player = this.roundActivePlayer();

  if (player.triggerEventEnabled())
    throw new Error('Нельзя вернуть поле в руку, пока у игрока команды не завершено активное событие');

  const superGame = this.game();
  const currentTable = this.merged ? superGame.decks.table : this.decks.table;
  const gamePlanes = currentTable.select({
    className: 'Plane',
    attr: { anchorGameId: this.id() },
  });

  for (const plane of gamePlanes) {
    if (plane.mergedPlaneId) {
      const mergedPlane = superGame.get(plane.mergedPlaneId);
      mergedPlane.set({ mergedGameId: null });
      for(const bridge of mergedPlane.getLinkedBridges()) {
        bridge.set({ mergedGameId: null });
      }
      plane.set({ mergedPlaneId: null });
    }

    plane.removeFromTableToHand({ player });
    if (this.merged) plane.game(this);
  }
  player.set({ eventData: { plane: {}, availableZones: [] } });

  this.set({ merged: null, roundReady: false });
  superGame.set({
    turnOrder: superGame.turnOrder.filter((gameId) => gameId !== this.id()),
  });

  if (superGame.gameConfig === 'competition') {
    const pool = superGame.roundPool;
    const gameId = this.id();
    if (pool.get(gameId)) {
      pool.remove(gameId);
      pool.update('common', [...pool.get('common').data, this]);
      pool.setActive('common');
      if (pool.currentKey !== gameId) this.set({ roundReady: true });
    }
  }

  // принципиально делать после set({ merged: null })
  const playersHands = this.players().map((p) => p.find('Deck[domino]'));
  const dices = this.find('Deck[domino_common]').items();
  for (let i = 0; i < dices.length; i++) {
    const dice = dices[i];
    dice.moveToTarget(playersHands[i % playersHands.length]); // внутри сработает markDelete
    dice.markNew();
  }

  const gameCommonCardDeck = this.find('Deck[card_common]');
  gameCommonCardDeck.moveAllItems({ target: player.find('Deck[card]'), markNew: true });

  const event = domain.game.events.common.putPlaneFromHand();
  this.initEvent({
    name: 'returnFieldToHand',
    ...event
  }, { allowedPlayers: [player] });
});
