() => ({
  config: {
    playOneTime: true,
  },
  init: function () {
    const { game, player } = this.eventContext();

    const gameDeck = game.find('Deck[plane]');
    const deck = player.find('Deck[plane]');

    for (let i = 0; i < game.settings.planesToChoose; i++) {
      const plane = gameDeck.getRandomItem();
      if (plane) plane.moveToTarget(deck);
    }
  },
  handlers: {
    RESET: function () {
      const { game, player, source, sourceId } = this.eventContext();

      const gameDeck = game.find('Deck[plane]');
      const deck = player.find('Deck[plane]');
      const itemIds = Object.keys(deck.itemMap);
      for (const itemId of itemIds) {
        game.getStore().plane[itemId].moveToTarget(gameDeck);
      }

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
        const planeDeck = player.find('Deck[plane]');
        const plane = planeDeck.select('Plane')[0];
        if (plane) game.run('showPlanePortsAvailability', { joinPlaneId: plane._id });
      }
      const availablePortConfig = game.availablePorts[0];
      if (availablePortConfig) game.run('putPlaneOnField', availablePortConfig);
      else this.emit('RESET');
    },
  },
});
