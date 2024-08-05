(function () {
  return this.initEvent(domain.game.events.common.gameProcess(), {
    defaultResetHandler: true,
    allowedPlayers: this.players(),
  });
});
