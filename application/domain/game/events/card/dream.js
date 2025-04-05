() => ({
  init: function () {
    const { game, player } = this.eventContext();

    const eventData = { plane: {} };
    for (const plane of game.decks.table.getAllItems()) {
      if (plane.isCardPlane()) continue;
      eventData.plane[plane.id()] = { selectable: true };
    }
    player.set({ eventData });
  },
  handlers: {
    RESET: function () {
      const { game, player } = this.eventContext();

      player.set({ eventData: { plane: null } });
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
      const targetId = Object.entries(player.eventData.plane).find(([id, p]) => p.selectable)[0];
      const target = game.get(targetId);
      this.emit('TRIGGER', { target });
    },
  },
});
