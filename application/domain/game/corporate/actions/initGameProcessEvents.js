(function () {
  const event = domain.game.events.common.gameProcess();

  if (!this.isCoreGame()) {
    event.handlers['RELEASE'] = function () {
      const { game, player } = this.eventContext();
      if (game.checkFieldIsReady()) {
        this.emit('RESET');
        game.run('initGameFieldsMerge');
        return;
      }
      return { preventListenerRemove: true };
    };
  }

  return this.initEvent(event, {
    defaultResetHandler: true,
    allowedPlayers: this.players(),
  });
});
