(function () {
  const player = this.roundActivePlayer();
  const event = domain.game.events.common.putPlaneFromHand();

  this.initEvent(
    {
      ...event,
      init: function () {
        return this.emit('CHECK_AVAILABLE_PORTS');
      },
      handlers: {
        ...event.handlers,
        CHECK_AVAILABLE_PORTS: function () {
          const { game, player } = this.eventContext();
          const playerPlaneDeck = player.find('Deck[plane]');
          const superGame = game.game();
          let hasAvailablePorts = false;

          for (const plane of game.decks.table.items()) {
            for (const port of plane.ports()) {
              superGame.run('showPlanePortsAvailability', { joinPortId: port.id() });
              const filteredAvailablePorts = superGame.availablePorts.filter(({ targetPlaneId }) => {
                return superGame.get(targetPlaneId).sourceGameId === superGame.id();
              });
              if (filteredAvailablePorts.length > 0) {
                port.set({ eventData: { selectable: true } });
                hasAvailablePorts = true;
              }
            }
          }
          if (!hasAvailablePorts) {
            // проверка на пустое поле, когда все блоки в руке
            if (playerPlaneDeck.itemsCount() === 0) {
              const gamePlanesInDeck = game.find('Deck[plane]').items();
              let maxPortPlanes = gamePlanesInDeck.filter(({ portMap }) => Object.keys(portMap).length === 4);
              if (maxPortPlanes.length === 0)
                maxPortPlanes = gamePlanesInDeck.filter(({ portMap }) => Object.keys(portMap).length === 3);

              const extraPlanes = [];
              while (extraPlanes.length < 2) {
                const extraPlane = maxPortPlanes[Math.floor(maxPortPlanes.length * Math.random())];
                if (!extraPlanes.includes(extraPlane)) {
                  extraPlanes.push(extraPlane);
                  extraPlane.moveToTarget(playerPlaneDeck);
                }
              }
            }
            this.emit('NO_AVAILABLE_PORTS');
          }
        },
        RESET: function () {
          const { game, sourceId } = this.eventContext();
          const superGame = game.game();

          // привязка связанных plane еще не произошло
          const planes = [].concat(game.decks.table.items()).concat(superGame.decks.table.items());
          for (const plane of planes) {
            plane.set({ eventData: { selectable: null } });
            plane.updatePorts({ eventData: { selectable: null } });
          }

          player.removeEvent(this);
          game.removeAllEventListeners({ sourceId });
        },
        TRIGGER: function ({ target }) {
          const { game, player } = this.eventContext();
          const playerPlaneDeck = player.find('Deck[plane]');

          switch (target._col) {
            case 'port':
              if (playerPlaneDeck.itemsCount()) throw new Error('Должны быть размещены все блоки из руки.');

              const port = target;
              const superGame = game.game();
              superGame.run('showPlanePortsAvailability', { joinPortId: port.id() }, player);
              superGame.set({
                availablePorts: superGame.availablePorts.filter(({ targetPlaneId }) => {
                  return superGame.get(targetPlaneId).sourceGameId === superGame.id();
                }),
              });
              break;

            case 'plane':
              const plane = target;

              const remainPlaneOnTable = game.decks.table
                .items()
                .find((item) => item.id() !== plane.id() && !item.cardPlane);
              if (!remainPlaneOnTable) throw new Error('Нельзя убирать все блоки с игрового поле.');

              game.set({ availablePorts: [] });
              plane.moveToTarget(playerPlaneDeck);
              plane.set({ left: 0, top: 0, eventData: { selectable: null, moveToHand: true } }); // !!! проверить moveToHand
              plane.updatePorts({ eventData: { selectable: null } });

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

              break;
          }
          return { preventListenerRemove: true };
        },
        ADD_PLANE: function ({ target: plane }) {
          const { game, player } = this.eventContext();
          const gamePlaneDeck = game.find('Deck[plane]');
          const playerPlaneDeck = player.find('Deck[plane]');

          if (!plane.eventData.moveToHand) {
            // один из новых блоков - остальные можно убрать
            const remainPlane = playerPlaneDeck.items().find(({ eventData: { moveToHand } }) => !moveToHand);
            if (remainPlane) {
              // в колоде мог остаться всего один блок на выбор
              remainPlane.moveToTarget(gamePlaneDeck);
            }
          }

          if (plane.game().isCoreGame()) {
            const gameCommonDominoDeck = game.find('Deck[domino_common]');
            const gameCommonCardDeck = game.find('Deck[card_common]');
            for (const player of game.players()) {
              player.find('Deck[domino]').moveAllItems({ target: gameCommonDominoDeck, markNew: true });
              player.find('Deck[card]').moveAllItems({ target: gameCommonCardDeck, markNew: true });
            }

            game.set({ merged: true });
            this.emit('RESET');
            return;
          }
          if (playerPlaneDeck.itemsCount() === 0) {
            this.emit('RESET');
            game.run('initGameProcessEvents');
            return;
          }

          this.emit('NO_AVAILABLE_PORTS');

          return { preventListenerRemove: true };
        },
        END_ROUND: function () {
          const { game, source: plane } = this.eventContext();
          const superGame = game.game();

          for (const plane of game.decks.table.items()) {
            const joinPlaneId = plane.id();
            superGame.run('showPlanePortsAvailability', { joinPlaneId });
            if (superGame.availablePorts.length) {
              superGame.run('putPlaneOnField', superGame.availablePorts[0]);
              return this.emit('RESET');
            }
          }

          this.emit('CHECK_PLANES_IN_HANDS');
          this.emit('RESET');
          game.run('initGameProcessEvents');
        },
      },
    },
    { allowedPlayers: [player] }
  );
});
