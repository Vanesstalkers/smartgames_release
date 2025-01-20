() => ({
  init: function () {
    const { game, player } = this.eventContext();

    if (game.isSinglePlayer()) {
      this.emit('TRIGGER', { target: player });
      return { removeEvent: true };
    } else {
      for (const player of game.players()) {
        player.set({ eventData: { selectable: true } });
      }
      player.set({ eventData: { canSelectWorkers: true } });
    }
  },
  handlers: {
    RESET: function () {
      const { game, player, source, sourceId } = this.eventContext();

      for (const player of game.players()) {
        player.set({ eventData: { selectable: null } });
      }
      player.set({ eventData: { canSelectWorkers: null } });

      source.removeEvent(this);
      player.removeEvent(this);
      game.removeAllEventListeners({ event: this });
    },
    TRIGGER: function ({ target: targetPlayer }) {
      const { game, player } = this.eventContext();

      game.logs({
        msg: `Игрок {{player}} стал целью события "${this.getTitle()}".`,
        userId: targetPlayer.userId,
      });

      const targetPlayerHand = targetPlayer.find('Deck[domino]');
      const gameDeck = game.find('Deck[domino]');

      targetPlayerHand.moveAllItems({ target: gameDeck });

      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();
      this.emit('TRIGGER', { target: player });
    },
  },
});
