() => ({
  tutorial: {
    text: 'Игрок получает дополнительные 15 секунд на ход',
  },
  init: function () {
    const { game, player } = this.eventContext();
    lib.timers.timerRestart(game, { extraTime: 15 });
    return { resetEvent: true };
  },
});
