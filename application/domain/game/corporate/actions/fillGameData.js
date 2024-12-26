(function (data) {
  this.run('domain.fillGameData', data);

  const { Dice, Deck, Card } = this.defaultClasses();

  if (!this.isCoreGame() && !this.restorationMode) {
    this.addDeck(
      {
        type: 'domino',
        subtype: 'common',
        access: this.playerMap,
      },
      { deckClass: Deck, deckItemClass: Dice }
    );
    this.addDeck(
      {
        type: 'card',
        subtype: 'common',
        access: this.playerMap,
      },
      { deckClass: Deck, deckItemClass: Card }
    );
  }

  this.clearChanges(); // игра запишется в БД в store.create
  return this;
});
