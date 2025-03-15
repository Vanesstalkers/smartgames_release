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

      // if (target.eventData.actionsDisabled) {
      // lib.store.broadcaster.publishAction(`user-${player.userId}`, 'broadcastToSessions', {
      //   data: { message: zoneParentIsBlocked.map((msg) => msg).split(' ') },
      //   // config: { hideTime: 3000 },
      // });
      // }

      const deck = game.find('Deck[domino]');
      const ids = [];
      for (const dice of target.select({ className: 'Dice', directParent: false })) {
        dice.moveToTarget(deck);
        ids.push(dice.id());
      }
      target.set({ release: null });

      if (ids.length) game.game().broadcastEvent('DICES_DISABLED', { ids }); // если у кто активирован refactoring

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
