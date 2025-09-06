(function () {
  // !!! перенести сюда наполнение стартовой руки (из core-репозитория)
  return this.initEvent({
    name: 'initGameProcessEvents',
    ...domain.game.events.common.gameProcess()
  }, {
    allowedPlayers: this.players(),
  });
});
