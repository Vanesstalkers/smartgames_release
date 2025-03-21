(function ({ }, initPlayer) {
  if (initPlayer.triggerEventEnabled())
    throw new Error('Нельзя вернуть поле в руку, пока не завершено активное событие');

  const superGame = this.game();
  const currentTable = this.merged ? superGame.decks.table : this.decks.table;
  const gamePlanes = currentTable.select({
    className: 'Plane',
    attr: { anchorGameId: this.id() },
  });

  for (const plane of gamePlanes) {
    plane.removeFromTableToHand({ player: initPlayer });
    if (this.merged) plane.game(this);
  }
  initPlayer.set({ eventData: { plane: {}, availableZones: [] } });

  if (this.merged) {
    // // иначе не будет обрабатываться RELEASE с последующим initGameFieldsMerge
    // const gameProcessEvent = this.eventData.activeEvents.find(event => event.name == 'gameProcess');
    // if(gameProcessEvent) gameProcessEvent.destroy(); // может не быть (???)
    this.run('initGameProcessEvents');
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
  this.initEvent({
    name: 'returnFieldToHand',
    ...event
  }, { allowedPlayers: [initPlayer] });
});
