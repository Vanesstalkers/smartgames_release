() => ({
  config: {
    playOneTime: true,
  },
  init: function () {
    const { game, player } = this.eventContext();
    const deck = game.find('Deck[plane]');
    const code = 'event_req_tax';

    deck.addItem({
      _code: code,
      price: 50,
      release: true,
      ...{ cardPlane: true, width: 120, height: 180 },
      customClass: ['card-plane', 'card-event', `card-${code}`],
      zoneLinks: {},
      zoneList: [],
      portList: [{ _code: 1, left: 22.5, top: 105, direct: { bottom: true }, links: [], t: 'any', s: 'core' }],
    });
    const plane = deck.find(`Plane[${code}]`);
    game.run('showPlanePortsAvailability', { joinPlaneId: plane._id });
  },
  handlers: {
    RESET: function () {
      const { game, player, source, sourceId } = this.eventContext();
      source.removeEvent(this);
      player.removeEvent(this);
      game.removeAllEventListeners({ sourceId });
    },
    ADD_PLANE: function () {
      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();

      if (!game.availablePorts.length) {
        const plane = game.find('Plane[event_req_tax]');
        game.run('showPlanePortsAvailability', { joinPlaneId: plane._id });
      }
      const availablePortConfig = game.availablePorts[0];
      if (availablePortConfig) game.run('putPlaneOnField', availablePortConfig);
      else this.emit('RESET');
    },
  },
});
