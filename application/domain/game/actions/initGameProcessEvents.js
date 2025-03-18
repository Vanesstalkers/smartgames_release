(function () {
  return this.initEvent({
    name: 'initGameProcessEvents',
    ...domain.game.events.common.gameProcess()
  }, {
    allowedPlayers: this.players(),
  });
});
