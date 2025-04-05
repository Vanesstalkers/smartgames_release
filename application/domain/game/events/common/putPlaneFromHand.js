() => ({
  name: 'putPlaneFromHand',
  data: {
    extraPlanes: [],
  },
  handlers: {
    RESET() {
      const { game, player } = this.eventContext();
      game.set({ availablePorts: [] });
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

        /* 
          1. не делаем этого в RESET, потому что им позульзуются другие события, которым может помешать сброс состояния
          2. не делаем сброс в ADD_PLANE для каждого отдельного plane-а, потому что в NO_AVAILABLE_PORTS они буду перезаписаны (автоматическая подстветка при добавлении новых полей в режиме исправления конфликта интеграции)
        */
        const eventData = { plane: {} };
        for (const plane of game.decks.table.items()) {
          eventData.plane[plane.id()] = {
            selectable: null, oneOfMany: null, mustBePlaced: null, extraPlane: null
          };
        }
        player.set({ eventData });

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
        joinPlane.moveToTarget(game.decks.table);
        return { preventListenerRemove: true };
      }

      const planeStates = game.decks.table.getAllItems().reduce((acc, plane) => {
        const canBeRemoved = plane.canBeRemovedFromTable({ player });
        acc[plane.id()] = canBeRemoved ? { selectable: true, mustBePlaced: true } : null;
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
      // можно класть блоки только на исходные игры (без этого выставиться некорректный anchorGameId)
      const plane = player.game().find('Deck[plane]').getRandomItem();
      if (!plane) throw new Error('В колоде закончились блоки');

      this.data.extraPlanes.push(plane);
      plane.moveToTarget(player.find('Deck[plane]'));
      player.set({ eventData: { plane: { [plane.id()]: { extraPlane: true } } } });
      plane.markNew();

      return { preventListenerRemove: true };
    },
    CHECK_PLANES_IN_HANDS() {
      const { game, player } = this.eventContext();
      if (game.status === 'FINISHED') return;
      game.run('putPlaneOnFieldRecursive', { fromHand: true }, player);
      return { preventListenerRemove: true };
    },
    END_ROUND() {
      this.emit('CHECK_PLANES_IN_HANDS');
      this.emit('RESET');
    }
  }
});
