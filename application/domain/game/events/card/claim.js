() => ({
  init: function () {
    const { game, player } = this.eventContext();

    if (game.isSinglePlayer()) {
      this.emit('TRIGGER', { target: player });
      return { resetEvent: true };
    } else {
      const eventData = { player: {} };
      for (const player of game.players()) {
        eventData.player[player.id()] = { selectable: true };
      }
      player.set({ eventData });
    }
  },
  handlers: {
    RESET: function () {
      const { game, player } = this.eventContext();
      player.set({ eventData: { player: null } });
      this.destroy();
    },
    TRIGGER: function ({ target: targetPlayer }) {
      const { game, player } = this.eventContext();

      game.logs({
        msg: `Игрок {{player}} стал целью события <a>${this.getTitle()}</a>.`,
        userId: targetPlayer.userId,
      });

      const targetPlayerHand = targetPlayer.find('Deck[domino]');
      const gameDeck = game.find('Deck[domino]');

      targetPlayerHand.moveAllItems({ target: gameDeck, markDelete: true });

      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();
      this.emit('TRIGGER', { target: player });
    },
  },
});
