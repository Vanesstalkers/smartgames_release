() => ({
  init: function () {
    const { game, player } = this.eventContext();

    if (game.isSinglePlayer()) {
      player.set({ eventData: { skipTurn: true } });
      return { resetEvent: true };
    } else {
      for (const player of game.players()) {
        player.set({ eventData: { selectable: true } });
      }
      player.set({ eventData: { canSelectWorkers: true } });
    }
  },
  handlers: {
    RESET: function () {
      const { game, player } = this.eventContext();

      for (const player of game.players()) {
        player.set({ eventData: { selectable: null } });
      }
      player.set({ eventData: { canSelectWorkers: null } });

      this.destroy();
    },
    TRIGGER: function ({ target: targetPlayer }) {
      const { game, player } = this.eventContext();

      game.logs({
        msg: `Игрок {{player}} стал целью события "${this.getTitle()}".`,
        userId: targetPlayer.userId,
      });

      targetPlayer.set({ eventData: { skipTurn: true } });
      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();
      this.emit('TRIGGER', { target: player });
    },
  },
});
