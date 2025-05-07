(function (data) {
  this.run('domain.fillGameData', data);
  const { roundActiveGameId, turnOrder = [] } = data;
  this.set({ roundActiveGameId, turnOrder });

  const { Dice, Deck, Card } = this.defaultClasses();

  if (!this.restorationMode) {
    const isCoreGame = this.isCoreGame();

    if (isCoreGame) {
      const planes = this.find('Deck[plane]').items();
      for (const plane of planes) plane.addCustomClass('core');
    }

    if (!isCoreGame) {
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
  }

  this.clearChanges(); // игра запишется в БД в store.create
  return this;
});
