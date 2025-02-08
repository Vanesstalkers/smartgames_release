() => ({
  handlers: {
    RESET: function () {
      const { game, player } = this.eventContext();

      player.set({ eventData: { showNoAvailablePortsBtn: null, fakePlaneAddBtn: null } });

      const gameDeck = game.find('Deck[plane]');
      const playerPlaneDeck = player.find('Deck[plane]');
      playerPlaneDeck.moveAllItems({ target: gameDeck });

      game.decks.table.updateAllItems({
        eventData: { selectable: null, moveToHand: null, extraPlane: null },
      });

      this.destroy();
    },
    ADD_PLANE: function ({ target: plane }) {
      const { game, player } = this.eventContext();
      const gamePlaneDeck = game.find('Deck[plane]');
      const playerPlaneDeck = player.find('Deck[plane]');
      const planeList = playerPlaneDeck.select('Plane');

      const requiredPlanes = planeList.filter((plane) => plane.eventData.moveToHand);
      if (requiredPlanes.length === 0) {
        game.checkDiceResource();
        this.emit('RESET');
      } else {
        if (plane.eventData.extraPlane) {
          const extraPlanes = planeList.filter((plane) => plane.eventData.extraPlane);
          if (extraPlanes.length) {
            for (const plane of extraPlanes) {
              plane.moveToTarget(gamePlaneDeck);
            }
          }
        }

        this.emit('NO_AVAILABLE_PORTS');
        return { preventListenerRemove: true };
      }
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

        player.set({ eventData: { showNoAvailablePortsBtn: true, fakePlaneAddBtn: true } });
      }

      return { preventListenerRemove: true };
    },
    // обработчик для выбора блока, который нужно забрать с поля
    TRIGGER: function ({ target: plane }) {
      const { game, player } = this.eventContext();

      if (!plane) return;

      plane.removeFromTable({
        target: player.find('Deck[plane]'),
      });

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
    END_ROUND: function () {
      this.emit('CHECK_PLANES_IN_HANDS');
      this.emit('RESET');
    },
  },
});
