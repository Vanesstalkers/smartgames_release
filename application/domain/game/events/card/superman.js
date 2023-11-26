() => ({
  init: function () {
    const { game, player } = this.eventContext();
    player.set({ eventData: { disablePlayerHandLimit: true } });
  },
});
