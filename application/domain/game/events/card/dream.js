() => ({
  init: function () {
    const { game, player } = this.eventContext();
    for (const plane of game.decks.table.getAllItems()) {
      if (plane.isCardPlane()) continue;
      plane.set({ eventData: { selectable: true } });
    }
  },
  handlers: {
    RESET: function () {
      const { game } = this.eventContext();

      game.decks.table.updateAllItems({ eventData: { selectable: null } });

      this.destroy();
    },
    TRIGGER: function ({ target }) {
      if (!target) return;
      const { game, player } = this.eventContext();

      const deck = game.find('Deck[domino]');
      for (const dice of target.select({ className: 'Dice', directParent: false })) {
        dice.moveToTarget(deck);
      }
      target.set({ release: null });

      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();
      const planes = game.decks.table.getAllItems();
      const target = planes.find((plane) => !plane.isCardPlane());
      this.emit('TRIGGER', { target });
    },
  },
});
