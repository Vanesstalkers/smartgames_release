() => ({
  handlers: {
    RESET: function () {
      const { game, player } = this.eventContext();

      player.set({ eventData: { showNoAvailablePortsBtn: null } });

      const gameDeck = game.find('Deck[plane]');
      const playerPlaneDeck = player.find('Deck[plane]');
      playerPlaneDeck.moveAllItems({ target: gameDeck });

      game.decks.table.updateAllItems({
        eventData: { selectable: null, moveToHand: null },
      });

      this.destroy();
    },
    NO_AVAILABLE_PORTS: function ({ joinPlane }) {
      const { game, player } = this.eventContext();

      if (game.decks.table.itemsCount() === 0) {
        if (!joinPlane) {
          const playerPlaneDeck = player.find('Deck[plane]');
          joinPlane = playerPlaneDeck
            .getAllItems()
            .sort(({ portMap: a }, { portMap: b }) => {
              return Object.keys(a).length < Object.keys(b).length ? -1 : 1; // наибольшее количество port-ов
            })
            .pop();
        }
        this.putPlaneOnEmptyField = true;
        joinPlane.moveToTarget(game.decks.table);
      } else {
        for (const plane of game.decks.table.getAllItems()) {
          const linkedPlanes = plane.getLinkedPlanes();
          const linkedCardPlanes = linkedPlanes.filter(({ cardPlane }) => cardPlane);
          const eventData =
            linkedPlanes.length - linkedCardPlanes.length < 2
              ? { selectable: true, moveToHand: true }
              : { selectable: null, moveToHand: null };
          plane.set({ eventData });
        }

        player.set({ eventData: { showNoAvailablePortsBtn: true } });
      }

      return { preventListenerRemove: true };
    },
    // обработчик для выбора блока, который нужно забрать с поля
    TRIGGER: function ({ target: plane }) {
      if (!plane) return;
      const { game, player } = this.eventContext();
      const playerPlaneDeck = player.find('Deck[plane]');

      plane.moveToTarget(playerPlaneDeck);
      plane.set({ left: 0, top: 0, eventData: { selectable: null } });

      const linkedBridges = plane.getLinkedBridges();
      for (const bridge of linkedBridges) {
        game.run('removeBridge', { bridge });

        if (!plane.cardPlane && bridge.bridgeToCardPlane) {
          const cardPlaneId = bridge.linkedPlanesIds.find((id) => id !== plane.id());
          const cardPlane = game.get(cardPlaneId);
          cardPlane.moveToTarget(playerPlaneDeck);
          cardPlane.set({ left: 0, top: 0, eventData: { selectable: null } });
        }
      }

      game.set({ availablePorts: [] });
      this.emit('NO_AVAILABLE_PORTS');
      return { preventListenerRemove: true };
    },
    CHECK_PLANES_IN_HANDS: function () {
      const { game } = this.eventContext();
      
      if (game.status === 'FINISHED') return;

      game.run('putPlaneOnFieldRecursive', { fromHand: true });

      return { preventListenerRemove: true };
    },
  },
});
