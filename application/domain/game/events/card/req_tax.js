() => {
  const event = domain.game.events.common.putPlaneFromHand();

  event.init = function () {
    const { game, player, source: card } = this.eventContext();
    const deck = game.find('Deck[plane]');
    const playerHand = player.find('Deck[plane]');
    const superGameMode = game.hasSuperGame || game.isSuperGame;

    const superGameSfx = superGameMode ? `-${card.sourceGameId.slice(-4)}` : ''; // могут быть одинаковые card-plane на одном поле
    const code = 'event_req_tax' + superGameSfx;
    const plane = deck.addItem({
      ...(superGameMode ? { sourceGameId: card.sourceGameId } : {}),
      _code: code,
      price: 50,
      release: true,
      ...{ cardPlane: true, width: 120, height: 180 },
      customClass: ['card-plane', 'card-event', `card-${code}`],
      portList: [{ _code: 1, left: 22.5, top: 105, direct: { bottom: true }, links: [], t: 'any', s: 'core' }],
    });
    if (plane) {
      plane.moveToTarget(playerHand);
      game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, player);
    }
  };

  event.handlers['ADD_PLANE'] = function () {
    const { game, player } = this.eventContext();
    const playerPlaneDeck = player.find('Deck[plane]');
    const planeList = playerPlaneDeck.select('Plane');

    if (planeList.length == 0) {
      game.checkDiceResource();
      this.emit('RESET');
    } else {
      this.emit('NO_AVAILABLE_PORTS');
      return { preventListenerRemove: true };
    }
  };

  event.handlers['END_ROUND'] = function () {
    this.emit('CHECK_PLANES_IN_HANDS');
    this.emit('RESET');
  };

  return event;
};
