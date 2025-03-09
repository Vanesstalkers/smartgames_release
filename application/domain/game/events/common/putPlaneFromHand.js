() => ({
  data: {
    extraPlanes: [],
  },
  handlers: {
    RESET: function () {
      const { game, player } = this.eventContext();

      player.set({ eventData: { showNoAvailablePortsBtn: null, fakePlaneAddBtn: null, plane: null } });
      player.find('Deck[plane]').moveAllItems({ target: game.find('Deck[plane]') });

      this.destroy();
    },
    ADD_PLANE: function ({ target: plane }) {
      const { game, player } = this.eventContext();
      const gamePlaneDeck = game.find('Deck[plane]');
      const playerPlaneDeck = player.find('Deck[plane]');
      const planeList = playerPlaneDeck.select('Plane');

      const requiredPlanes = planeList.filter((planeItem) =>
        player.eventData.plane?.[planeItem.id()]?.mustBePlaced
      );

      if (requiredPlanes.length === 0) {
        game.checkDiceResource();
        this.emit('RESET');
      } else {
        if (player.eventData.plane?.[plane.id()]?.extraPlane) {
          for (const extraPlane of this.data.extraPlanes) {
            if (extraPlane === plane) continue;
            extraPlane.moveToTarget(gamePlaneDeck);
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
        const eventData = { plane: {} };

        for (const plane of game.decks.table.getAllItems()) {
          const linkedPlanes = plane.getLinkedPlanes();
          const linkedCardPlanes = linkedPlanes.filter((p) => p.cardPlane);
          const canBeRemovedFromField = linkedPlanes.length - linkedCardPlanes.length < 2;
          eventData.plane[plane.id()] = canBeRemovedFromField ? { selectable: true, mustBePlaced: true } : null;
        }

        player.set({ eventData: { ...eventData, showNoAvailablePortsBtn: true, fakePlaneAddBtn: true } });
      }

      return { preventListenerRemove: true };
    },
    // обработчик для выбора блока, который нужно забрать с поля
    TRIGGER: function ({ target: plane }) {
      const { game, player } = this.eventContext();

      if (!plane) return;

      plane.removeFromTableToHand({ player });

      game.set({ availablePorts: [] });
      this.emit('NO_AVAILABLE_PORTS');

      return { preventListenerRemove: true };
    },
    TRIGGER_EXTRA_PLANE: function ({ initPlayer: player }) {
      const { game } = this.eventContext();
      const deck = player.find('Deck[plane]');
      const gameDeck = game.find('Deck[plane]');

      const plane = gameDeck.getRandomItem();
      if (!plane) throw new Error('В колоде закончились блоки');

      this.data.extraPlanes.push(plane);

      plane.moveToTarget(deck);
      player.set({ eventData: { plane: { [plane.id()]: { extraPlane: true } } } });
      plane.markNew();

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
