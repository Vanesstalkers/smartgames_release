() => ({
  init: function () {
    const { game, player } = this.eventContext();

    const eventData = { plane: {} };
    for (const plane of game.decks.table.getAllItems()) {
      if (plane.isCardPlane()) continue;
      eventData.plane[plane.id()] = { selectable: true, dicesCount: plane.dicesCount() };
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
        if (dice.deleted) domain.game.actions.restoreDice.call(game, { diceId: dice.id() }, player);
        dice.moveToTarget(deck);
      }
      target.set({ release: null });

      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();
      const targetId = Object.entries(player.eventData.plane)
        .sort(([idA, p1], [idB, p2]) => (p2.dicesCount || 0) - (p1.dicesCount || 0)) // plane с наибольшим количеством костяшек
        .find(([id, p]) => p.selectable)?.[0];
      if (!targetId) return this.emit('RESET');
      const target = game.get(targetId);
      this.emit('TRIGGER', { target });
    },
  },
});
