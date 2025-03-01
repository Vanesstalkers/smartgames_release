(function () {
  const player = this.roundActivePlayer();
  const {
    data,
    handlers: {
      //
      NO_AVAILABLE_PORTS,
      TRIGGER_EXTRA_PLANE,
      CHECK_PLANES_IN_HANDS,
    },
  } = domain.game.events.common.putPlaneFromHand();

  this.initEvent(
    {
      data,
      init() {
        const { game } = this.eventContext();
        const superGame = game.game();
        superGame.broadcastEvent('DICES_DISABLED', { parent: game });
        return this.emit('CHECK_AVAILABLE_PORTS');
      },
      handlers: {
        NO_AVAILABLE_PORTS,
        TRIGGER_EXTRA_PLANE,
        CHECK_PLANES_IN_HANDS,
        CHECK_AVAILABLE_PORTS() {
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

            game.logs(`У центрального поля не найдено доступных портов для присоединения игрового поля команды.`);
            lib.store.broadcaster.publishAction(`user-${player.userId}`, 'broadcastToSessions', {
              data: {
                message: `У центрального поля не найдено доступных портов для присоединения игрового поля команды. Либо добавьте дополнительный блок к своему полю, либо одна из команд должна вернуть свое присоединенное в центру игровое поле в руку.`,
              },
              config: { hideTime: 0 },
            });

            this.emit('NO_AVAILABLE_PORTS');
          }
        },
        RESET() {
          const { game, player } = this.eventContext();
          const superGame = game.game();
          const gameDeck = game.find('Deck[plane]');
          const playerPlaneDeck = player.find('Deck[plane]');

          player.set({ eventData: { showNoAvailablePortsBtn: null, fakePlaneAddBtn: null } });
          playerPlaneDeck.moveAllItems({ target: gameDeck });
          game.decks.table.updateAllItems({
            eventData: { selectable: null, moveToHand: null, extraPlane: null },
          });

          // привязка связанных plane еще не произошло
          const planes = [].concat(game.decks.table.items()).concat(superGame.decks.table.items());
          for (const plane of planes) {
            plane.set({ eventData: { selectable: null } });
            plane.updatePorts({ eventData: { selectable: null } });
          }

          this.destroy();
        },
        TRIGGER({ target }) {
          const { game, player } = this.eventContext();
          const playerPlaneDeck = player.find('Deck[plane]');

          switch (target._col) {
            case 'port':
              if (playerPlaneDeck.itemsCount()) throw new Error('Должны быть размещены все блоки из руки.');

              const port = target;
              const superGame = game.game();

              superGame.run('showPlanePortsAvailability', { joinPortId: port.id() }, player);

              const onlySuperGameCorePorts = superGame.availablePorts.filter(({ targetPlaneId }) => {
                const targetPlane = superGame.get(targetPlaneId);
                return targetPlane.sourceGameId === superGame.id();
              });
              superGame.set({ availablePorts: onlySuperGameCorePorts });
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
        ADD_PLANE({ target: plane }) {
          const { game, player } = this.eventContext();
          const gamePlaneDeck = game.find('Deck[plane]');
          const playerPlaneDeck = player.find('Deck[plane]');
          const planeList = playerPlaneDeck.getAllItems();

          if (plane.eventData.extraPlane) {
            const extraPlanes = planeList.filter((plane) => plane.eventData.extraPlane);
            if (extraPlanes.length) {
              for (const plane of extraPlanes) {
                plane.moveToTarget(gamePlaneDeck);
              }
            }
          } else if (!plane.eventData.moveToHand) {
            // один из новых блоков для размещения на выбор - остальные можно убрать
            const remainPlane = planeList.find(() => !plane.eventData.moveToHand);
            if (remainPlane) {
              // в колоде мог остаться всего один блок на выбор
              remainPlane.moveToTarget(gamePlaneDeck);
            }
          }

          const mergeFinished = plane.game().isSuperGame;
          if (mergeFinished) {
            this.emit('RESET');
            return;
          }

          const extraPlanes = playerPlaneDeck.items().filter((plane) => plane.eventData.extraPlane);
          // plane-ы в руке кончились
          if (playerPlaneDeck.itemsCount() - extraPlanes.length === 0) {
            this.emit('RESET');
            game.run('initGameProcessEvents');
            return;
          }

          // на всякий случай подсвечиваем, какие еще plane-ы можно убрать с поля
          this.emit('NO_AVAILABLE_PORTS');

          return { preventListenerRemove: true };
        },
        END_ROUND() {
          const { game, source: plane } = this.eventContext();
          const superGame = game.game();

          for (const port of game.decks.table.getFreePorts()) {
            this.emit('TRIGGER', { target: port });
            const availablePort = superGame.availablePorts[0];
            if (!availablePort) continue;

            superGame.run('putPlaneOnField', availablePort);
            return this.emit('RESET');
          }

          this.emit('CHECK_PLANES_IN_HANDS');
          this.emit('RESET');
          game.run('initGameProcessEvents');
        },
      },
    },
    { player }
  );
});
