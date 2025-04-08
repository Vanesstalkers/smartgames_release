() => ({
  init: function () {
    const { game, player } = this.eventContext();
    const deck = this.getDeck();

    if(deck.itemsCount() == 0) return { resetEvent: true };

    this.eventDeck = player.addDeck(
      {
        type: 'domino',
        subtype: 'teamlead',
        itemType: 'any',
        settings: { itemsUsageLimit: 1, itemsStartCount: 5 },
        access: { [player._id]: {} },
      },
      { deckItemClass: game.defaultClasses()['Dice'] }
    );
    deck.moveRandomItems({ count: this.eventDeck.settings.itemsStartCount, target: this.eventDeck });
    this.extraCardCount = this.eventDeck.itemsCount(); // в колоде могло остаться меньше itemsStartCount карт
  },
  handlers: {
    RESET: function () {
      const { game, player } = this.eventContext();

      const deck = this.eventDeck;
      if (deck) {
        // deck еще не удален - не было сыграно достаточное количество dice
        const gameDominoDeck = this.getDeck();
        for (const itemId of Object.keys(deck.itemMap)) {
          game.getStore().dice[itemId].moveToTarget(gameDominoDeck);
        }
        player.deleteDeck(deck);
      }

      this.destroy();
    },
    DICE_PLACED: function () {
      const { game, player } = this.eventContext();

      const deck = this.eventDeck;
      const itemsCount = deck.itemsCount();
      const { itemsUsageLimit } = deck.settings;
      if (itemsCount > 0 && itemsCount > this.extraCardCount - itemsUsageLimit) {
        return { preventListenerRemove: true };
      }

      this.emit('RESET');
    },
    END_ROUND: function () {
      this.emit('RESET');
    },
  },
  getDeck() {
    const { game, player } = this.eventContext();
    const deck = game.find('Deck[domino]');
    return deck;
  },
});
