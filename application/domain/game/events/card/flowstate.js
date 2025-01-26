() => ({
  init: function () {
    const { game, player } = this.eventContext();
    const deck = game.find('Deck[domino]');

    if (deck.itemsCount() == 0) return { resetEvent: true };

    const newPlayerHand = player.addDeck(
      {
        type: 'domino',
        subtype: 'flowstate',
        itemType: 'any',
        settings: { itemsUsageLimit: 2, itemsStartCount: 3 },
        access: { [player._id]: {} },
      },
      { deckItemClass: game.defaultClasses()['Dice'] }
    );
    deck.moveRandomItems({ count: newPlayerHand.settings.itemsStartCount, target: newPlayerHand });
    this.extraCardCount = newPlayerHand.itemsCount(); // в колоде могло остаться меньше itemsStartCount карт
  },
  handlers: {
    RESET: function () {
      const { game, player } = this.eventContext();

      const deck = player.find('Deck[domino_flowstate]');
      if (deck) {
        // deck еще не удален - не было сыграно достаточное количество dice
        const gameDominoDeck = game.find('Deck[domino]');
        for (const itemId of Object.keys(deck.itemMap)) {
          game.getStore().dice[itemId].moveToTarget(gameDominoDeck);
        }
        player.deleteDeck(deck);
      }

      this.destroy();
    },
    DICE_PLACED: function () {
      const { game, player } = this.eventContext();

      const deck = player.find('Deck[domino_flowstate]');
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
});
