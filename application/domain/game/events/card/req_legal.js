() => {
  const event = domain.game.events.common.putPlaneFromHand();

  event.config = { playOneTime: true };

  event.init = function () {
    const { game, player } = this.eventContext();
    const deck = game.find('Deck[plane]');
    const playerHand = player.find('Deck[plane]');

    const code = 'event_req_legal';
    const plane = deck.addItem({
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
