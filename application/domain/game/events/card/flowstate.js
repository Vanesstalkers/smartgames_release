() => ({
  init: function () {
    const { game, player } = this.eventContext();
    const deck = game.find('Deck[domino]');

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
  },
  handlers: {
    RESET: function () {
      const { game, player, source, sourceId } = this.eventContext();

      const deck = player.find('Deck[domino_flowstate]');
      if (deck) {
        // deck еще не удален - не было сыграно достаточное количество dice
        const gameDominoDeck = game.find('Deck[domino]');
        for (const itemId of Object.keys(deck.itemMap)) {
          game.getStore().dice[itemId].moveToTarget(gameDominoDeck);
        }
        player.deleteDeck(deck);
      }

      source.removeEvent(this);
      player.removeEvent(this);
      game.removeAllEventListeners({ sourceId });
    },
    DICE_PLACED: function () {
      const { game, player } = this.eventContext();

      const deck = player.find('Deck[domino_flowstate]');
      const itemIds = Object.keys(deck.itemMap);
      const { itemsStartCount, itemsUsageLimit } = deck.settings;
      if (itemIds.length > itemsStartCount - itemsUsageLimit) {
        return { preventListenerRemove: true };
      }

      this.emit('RESET');
    },
    END_ROUND: function () {
      this.emit('RESET');
    },
  },
});
