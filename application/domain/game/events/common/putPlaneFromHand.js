() => ({
  data: {
    extraPlanes: [],
  },
  handlers: {
    RESET() {
      const { game, player } = this.eventContext();
      player.set({ eventData: { showNoAvailablePortsBtn: null, fakePlaneAddBtn: null, plane: null } });
      player.find('Deck[plane]').moveAllItems({ target: game.find('Deck[plane]') });
      this.destroy();
    },
    ADD_PLANE({ target: plane }) {
      const { game, player } = this.eventContext();
      const gamePlaneDeck = game.find('Deck[plane]');
      const playerPlaneDeck = player.find('Deck[plane]');
      const requiredPlanes = playerPlaneDeck.select('Plane')
        .filter(planeItem => player.eventData.plane?.[planeItem.id()]?.mustBePlaced);

      if (requiredPlanes.length === 0) {
        game.checkDiceResource();
        return this.emit('RESET');
      }

      if (player.eventData.plane?.[plane.id()]?.extraPlane) {
        this.data.extraPlanes
          .filter(extraPlane => extraPlane !== plane)
          .forEach(extraPlane => extraPlane.moveToTarget(gamePlaneDeck));
      }

      this.emit('NO_AVAILABLE_PORTS');
      return { preventListenerRemove: true };
    },
    NO_AVAILABLE_PORTS({ joinPlane }) {
      const { game, player } = this.eventContext();

      if (game.decks.table.itemsCount() === 0) {
        if (!joinPlane) {
          joinPlane = player.find('Deck[plane]')
            .getAllItems()
            .sort((a, b) => Object.keys(a.portMap).length < Object.keys(b.portMap).length ? -1 : 1)
            .pop();
        }
        this.putPlaneOnEmptyField = true;
        return joinPlane.moveToTarget(game.decks.table);
      }

      const planeStates = game.decks.table.getAllItems().reduce((acc, plane) => {
        const linkedPlanes = plane.getLinkedPlanes();
        const canRemove = linkedPlanes.length - linkedPlanes.filter(p => p.cardPlane).length < 2;
        acc[plane.id()] = canRemove ? { selectable: true, mustBePlaced: true } : null;
        return acc;
      }, {});

      player.set({ eventData: { plane: planeStates, showNoAvailablePortsBtn: true, fakePlaneAddBtn: true } });

      return { preventListenerRemove: true };
    },
    TRIGGER({ target: plane }) {
      if (!plane) return;
      const { game, player } = this.eventContext();
      plane.removeFromTableToHand({ player });
      game.set({ availablePorts: [] });
      this.emit('NO_AVAILABLE_PORTS');
      return { preventListenerRemove: true };
    },
    TRIGGER_EXTRA_PLANE({ initPlayer: player }) {
      const { game } = this.eventContext();
      const plane = game.find('Deck[plane]').getRandomItem();
      if (!plane) throw new Error('В колоде закончились блоки');

      this.data.extraPlanes.push(plane);
      plane.moveToTarget(player.find('Deck[plane]'));
      player.set({ eventData: { plane: { [plane.id()]: { extraPlane: true } } } });
      plane.markNew();

      return { preventListenerRemove: true };
    },
    CHECK_PLANES_IN_HANDS() {
      const { game } = this.eventContext();
      if (game.status === 'FINISHED') return;
      game.run('putPlaneOnFieldRecursive', { fromHand: true });
      return { preventListenerRemove: true };
    },
    END_ROUND() {
      this.emit('CHECK_PLANES_IN_HANDS');
      this.emit('RESET');
    }
  }
});
