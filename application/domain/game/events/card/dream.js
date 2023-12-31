() => ({
  init: function () {
    const { game, player } = this.eventContext();
    for (const plane of game.getObjects({ className: 'Plane', directParent: game })) {
      if (plane.isCardPlane()) continue;
      plane.set({ eventData: { selectable: true } });
    }
  },
  handlers: {
    RESET: function () {
      const { game, player, source, sourceId } = this.eventContext();

      for (const plane of game.getObjects({ className: 'Plane', directParent: game })) {
        plane.set({ eventData: { selectable: null } });
      }

      source.removeEvent(this);
      player.removeEvent(this);
      game.removeAllEventListeners({ sourceId });
    },
    TRIGGER: function ({ target }) {
      if (!target) return;
      const { game, player } = this.eventContext();

      const deck = game.find('Deck[domino]');
      for (const dice of target.select('Dice')) {
        dice.moveToTarget(deck);
      }
      target.set({ release: null });

      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();
      const planes = game.getObjects({ className: 'Plane', directParent: game });
      const target = planes.find((plane) => !plane.isCardPlane());
      this.emit('TRIGGER', { target });
    },
  },
});
