() => ({
  init: function () {
    const { game, player } = this.eventContext();
    lib.timers.timerRestart(game, { extraTime: 15 });
    return { removeEvent: true };
  },
});
