() => ({
  limitNotReached() {
    const deck = this.eventDeck;
    const itemsCount = deck.itemsCount();

    return itemsCount > 0 && itemsCount > this.extraCardCount - deck.settings.itemsUsageLimit;
  },
  init: function () {
    const { game, player } = this.eventContext();
    const deck = this.getDeck();

    if (deck.itemsCount() == 0) return { resetEvent: true };

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
    deck.moveRandomItems({
      count: this.eventDeck.settings.itemsStartCount,
      target: this.eventDeck,
      setData: { eventData: { sourceParentId: this.eventDeck.id() } },
    });
    this.eventDices = this.eventDeck.select('Dice');
    this.extraCardCount = this.eventDeck.itemsCount(); // в колоде могло остаться меньше itemsStartCount карт
  },
  handlers: {
    RESET: function () {
      const { game, player } = this.eventContext();

      const deck = this.eventDeck;
      const gameDominoDeck = this.getDeck();

      for (const itemId of Object.keys(deck.itemMap)) {
        const dice = game.get(itemId);
        dice.moveToTarget(gameDominoDeck, { setData: { locked: false, eventData: { sourceParentId: null } } });
      }
      player.deleteDeck(deck);

      this.destroy();
    },
    DICE_PLACED: function ({ dice }) {
      const { game, player } = this.eventContext();

      if (dice.eventData.sourceParentId !== this.eventDeck.id()) return { preventListenerRemove: true };
      if (this.limitNotReached()) return { preventListenerRemove: true };

      if (game.hasDiceReplacementEvent()) {
        this.eventDeck.updateAllItems({ locked: true });
        return { preventListenerRemove: true };
      }

      dice.set({ eventData: { sourceParentId: null } });

      this.emit('RESET');
    },
    DICE_RESTORE_NOT_AVAILABLE: function () {
      this.eventDeck.updateAllItems({ locked: null });
      return { preventListenerRemove: true };
    },
    DICE_REPLACEMENT_EVENT_ENDED: function () {
      if (this.limitNotReached()) return { preventListenerRemove: true };
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
