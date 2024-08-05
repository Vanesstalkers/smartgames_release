(function () {
  const event = domain.game.events.common.gameProcess();

  event.handlers['RELEASE'] = function () {
    const { game, player } = this.eventContext();
    if (game.checkFieldIsReady()) return game.run('initGameFieldsMerge');
    return { preventListenerRemove: true };
  };

  if (this.isCoreGame()) {
    event.handlers['ADD_PLANE'] = function ({ target: plane }) {
      const event = plane.eventData.activeEvents.find((event) => event.hasHandler('ADD_PLANE'));
      if (event) event.game().toggleEventHandlers('ADD_PLANE', { targetId: plane.id() });
      return { preventListenerRemove: true };
    };
  }

  return this.initEvent(event, {
    defaultResetHandler: true,
    allowedPlayers: this.players(),
  });
});
