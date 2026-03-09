() => ({
  tutorial: {
    text: 'В текущем раунде для игрока не будет проводиться проверка на лимит костяшек в руке',
  },
  init: function () {
    const { game, player } = this.eventContext();
    player.set({ eventData: { disablePlayerHandLimitAtRound: game.round } });
    return { resetEvent: true };
  },
});
