(function () {
  return this.initEvent(domain.game.events.common.gameProcess(), {
    allowedPlayers: this.players(),
  });
});
