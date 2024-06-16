() => ({
  handlers: {
    RESET: function () {
      const { game, player, source, sourceId } = this.eventContext();

      const gameDeck = game.find('Deck[plane]');
      const playerPlaneDeck = player.find('Deck[plane]');
      playerPlaneDeck.moveAllItems({ target: gameDeck });

      game.decks.table.updateAllItems({
        eventData: { selectable: null, moveToHand: null },
      });

      source.removeEvent(this);
      player.removeEvent(this);
      game.removeAllEventListeners({ sourceId });
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
      }

      return { preventListenerRemove: true };
    },
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

      this.emit('NO_AVAILABLE_PORTS');
      return { preventListenerRemove: true };
    },
    CHECK_PLANES_IN_HANDS: function () {
      const { game, player } = this.eventContext();
      const playerPlaneDeck = player.find('Deck[plane]');

      if (game.status === 'FINISHED') return;

      let planes = playerPlaneDeck.getAllItems();
      const usedPorts = [];
      while (planes.length) {
        let usedPort;
        const plane = planes
          .sort(({ portMap: a }, { portMap: b }) => {
            return Object.keys(a).length < Object.keys(b).length ? -1 : 1; // наибольшее количество port-ов
          })
          .pop();

        const joinPlaneId = plane.id();
        game.run('showPlanePortsAvailability', { joinPlaneId });
        if(this.putPlaneOnEmptyField){
          delete this.putPlaneOnEmptyField;
          break;
        }

        if (game.availablePorts.length) {
          usedPort = game.availablePorts[0];
          game.run('putPlaneOnField', usedPort); // нельзя делать через pop/unshift из-за проверки внутри putPlaneOnField
        } else {
          const planeForReturnToHand = game.decks.table
            .getAllItems()
            .filter(({ eventData }) => eventData.selectable)
            .sort(({ portMap: a }, { portMap: b }) => {
              return Object.keys(a).length > Object.keys(b).length ? -1 : 1; // наименьшее количество port-ов
            })
            .pop();
          this.emit('TRIGGER', { target: planeForReturnToHand });

          game.run('showPlanePortsAvailability', { joinPlaneId });
          if (game.availablePorts.length) {
            usedPort = game.availablePorts[0];
            game.run('putPlaneOnField', usedPort); // нельзя делать через pop/unshift из-за проверки внутри putPlaneOnField
          }
        }

        planes = playerPlaneDeck.getAllItems();
        const usedPortCode = planes.length + '::' + JSON.stringify(usedPort);
        if (!usedPorts.includes(usedPortCode)) {
          usedPorts.push(usedPortCode);
        } else {
          const planeDeck = game.find('Deck[plane]');
          const extraPlane = planeDeck
            .getAllItems()
            .sort(({ portMap: a }, { portMap: b }) => {
              return Object.keys(a).length < Object.keys(b).length ? -1 : 1;
            })
            .pop();
          if (extraPlane) {
            extraPlane.moveToTarget(playerPlaneDeck);
            extraPlane.set({ eventData: { moveToHand: true } });
            planes.push(extraPlane);
          } else {
            return game.run('endGame'); // проиграли все
          }
        }
      }

      return { preventListenerRemove: true };
    },
  },
});
