() => ({
  init: function () {
    const { game, player } = this.eventContext();
    player.set({ eventData: { disablePlayerHandLimitAtRound: game.round } });
    return { resetEvent: true };
  },
});
