(function () {
  const event = domain.game.events.common.gameProcess();

  event.handlers['RELEASE'] = function () {
    const { game, player } = this.eventContext();
    if (game.checkFieldIsReady()) return game.run('initGameFieldsMerge');
    return { preventListenerRemove: true };
  };

  return this.initEvent(event, {
    defaultResetHandler: true,
    allowedPlayers: this.players(),
  });
});
