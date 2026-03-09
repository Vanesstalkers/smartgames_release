() => ({
  tutorial: {
    text: 'Игрок делает еще один ход вне очереди',
  },
  init: function () {
    const { game, player } = this.eventContext();
    player.set({ eventData: { extraTurn: true } });
    return { resetEvent: true };
  },
});
