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
      name: 'initGameFieldsMerge',
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
          const availablePorts = [];
          const eventData = { port: {} };
          for (const plane of game.decks.table.items()) {
            for (const port of plane.ports()) {
              superGame.run('showPlanePortsAvailability', { joinPortId: port.id() }, player);
              const filteredAvailablePorts = superGame.availablePorts.filter(({ targetPlaneId }) => {
                const targetPlane = superGame.get(targetPlaneId);

                let result = targetPlane.sourceGameId === superGame.id();
                if (result && superGame.gameConfig === 'competition') {
                  result = targetPlane.anchorGameId === game.id();
                }
                
                return result;
              });
              if (filteredAvailablePorts.length > 0) {
                eventData.port[port.id()] = { selectable: true };
                hasAvailablePorts = true;
                availablePorts.push(...filteredAvailablePorts);
              }
            }
          }
          player.set({ eventData });
          superGame.set({ availablePorts });

          if (hasAvailablePorts) return { preventListenerRemove: true };

          // если поле пустое (сработает !hasAvailablePorts), тогда в руку ничего не добавляем
          if (playerPlaneDeck.itemsCount() === 0) {
            const planes = game.find('Deck[plane]').items();
            planes.sort((p1, p2) => (p2.portsCount() - p1.portsCount()));

            const extraPlanes = [];
            // Сначала берем все доступные plane с 4 портами
            const planesWithFourPorts = planes.filter((p) => p.portsCount() === 4);
            if (planesWithFourPorts.length > 0) {
              while (extraPlanes.length < Math.min(2, planesWithFourPorts.length)) {
                const extraPlane = planesWithFourPorts[Math.floor(Math.random() * planesWithFourPorts.length)];
                if (!extraPlanes.includes(extraPlane)) {
                  extraPlanes.push(extraPlane);
                }
              }
            }

            // Если нужно добрать plane с 3 портами
            if (extraPlanes.length < 2) {
              const planesWithThreePorts = planes.filter((p) => p.portsCount() === 3);
              while (extraPlanes.length < 2 && planesWithThreePorts.length > 0) {
                const extraPlane = planesWithThreePorts[Math.floor(Math.random() * planesWithThreePorts.length)];
                if (!extraPlanes.includes(extraPlane)) {
                  extraPlanes.push(extraPlane);
                }
              }
            }

            // Если все еще не хватает, добираем plane с 2 портами
            if (extraPlanes.length < 2) {
              const planesWithTwoPorts = planes.filter((p) => p.portsCount() === 2);
              while (extraPlanes.length < 2 && planesWithTwoPorts.length > 0) {
                const extraPlane = planesWithTwoPorts[Math.floor(Math.random() * planesWithTwoPorts.length)];
                if (!extraPlanes.includes(extraPlane)) {
                  extraPlanes.push(extraPlane);
                }
              }
            }

            if (extraPlanes.length === 0) {
              return game.run('endGame', {
                msg: { lose: 'Недостаточно ресурсов для интеграции. Продолжение игры не возможно.' },
              });
            }

            const eventData = { plane: {} };
            for (const plane of extraPlanes) {
              plane.moveToTarget(playerPlaneDeck);
              eventData.plane[plane.id()] = { oneOfMany: true };
            }
            player.set({ eventData });
          }

          game.logs(`У центрального поля не найдено доступных портов для присоединения игрового поля команды.`);
          lib.store.broadcaster.publishAction(`gameuser-${player.userId}`, 'broadcastToSessions', {
            data: {
              message: `У центрального поля не найдено доступных портов для присоединения игрового поля команды. Либо добавьте дополнительный блок к своему полю, либо одна из команд должна вернуть свое присоединенное к центру игровое поле в руку.`,
            },
            config: { hideTime: 0 },
          });

          this.emit('NO_AVAILABLE_PORTS');
          return { preventListenerRemove: true };
        },
        RESET() {
          const { game, player } = this.eventContext();
          const superGame = game.game();
          const gameDeck = game.find('Deck[plane]');
          const playerPlaneDeck = player.find('Deck[plane]');

          player.set({ eventData: { showNoAvailablePortsBtn: null, fakePlaneAddBtn: null, plane: null, port: null } });
          playerPlaneDeck.moveAllItems({ target: gameDeck });

          game.set({ availablePorts: [] });

          this.destroy();
        },
        TRIGGER({ target }) {
          const { game, player } = this.eventContext();
          const playerPlaneDeck = player.find('Deck[plane]');

          switch (target._col) {
            case 'port':
              if (playerPlaneDeck.itemsCount()) throw new Error('Должны быть размещены все блоки из руки');

              const port = target;
              const superGame = game.game();

              superGame.run('showPlanePortsAvailability', { joinPortId: port.id() }, player);

              const onlySuperGameCorePorts = superGame.availablePorts.filter(({ targetPlaneId }) => {
                const targetPlane = superGame.get(targetPlaneId);

                let result = targetPlane.sourceGameId === superGame.id();
                if (result && superGame.gameConfig === 'competition') {
                  result = targetPlane.anchorGameId === game.id();
                }

                return result;
              });
              superGame.set({ availablePorts: onlySuperGameCorePorts });
              break;

            case 'plane':
              const plane = target;

              if (!game.decks.table.items().find((p) => p.id() !== plane.id() && !p.cardPlane))
                throw new Error('Нельзя убирать все блоки с игрового поле');

              game.set({ availablePorts: [] });
              plane.removeFromTableToHand({ player });

              break;
          }
          return { preventListenerRemove: true };
        },
        ADD_PLANE({ target: plane }) {
          const { game, player } = this.eventContext();
          const gamePlaneDeck = game.find('Deck[plane]');
          const playerPlaneDeck = player.find('Deck[plane]');
          const planeList = playerPlaneDeck.getAllItems();

          const eventPlanes = player.eventData.plane || {};
          const planeId = plane.id();

          if (eventPlanes[planeId]?.extraPlane) {
            const extraPlanes = planeList.filter((p) => eventPlanes[p.id()]?.extraPlane);
            if (extraPlanes.length) {
              for (const plane of extraPlanes) {
                plane.moveToTarget(gamePlaneDeck);
              }
            }
          } else if (!eventPlanes[planeId]?.mustBePlaced) {
            // один из новых блоков для размещения на выбор - остальные можно убрать
            const remainPlane = planeList.find((p) => !eventPlanes[p.id()]?.mustBePlaced);
            if (remainPlane) {
              // в колоде мог остаться всего один блок на выбор
              remainPlane.moveToTarget(gamePlaneDeck);
            }
          }

          const mergeFinished = plane.game().isSuperGame;
          if (mergeFinished) {
            this.emit('RESET');

            this.mergeGame(plane);

            const superGame = plane.game();
            const currentRound = superGame.round;

            // проверка на то, что событие вызвано выкладыванием plane, а не завершением раунда
            if (!this.endRoundTriggered) game.run('roundEnd');

            if (superGame.allGamesMerged()) {
              if (currentRound !== superGame.round) {
                // раунд обновился, т.к. это была последняя игра с roundReady == false - принудительно завершать раунды в других играх не нужно, т.к. это будет уже завершение нового раунда
                return;
              }

              // принудительно завершаем раунды всех игр, чтобы переключиться на чередование раундов между играми
              for (const game of superGame.getAllGames()) {
                if (!game.roundReady) game.run('roundEnd');
              }
            }

            return;
          }

          const extraPlanes = playerPlaneDeck.items().filter((p) => eventPlanes[p.id()]?.extraPlane);
          // plane-ы в руке кончились
          if (playerPlaneDeck.itemsCount() - extraPlanes.length === 0) {
            return this.emit('RESET');
          }

          // на всякий случай подсвечиваем, какие еще plane-ы можно убрать с поля
          this.emit('NO_AVAILABLE_PORTS');

          return { preventListenerRemove: true };
        },
        END_ROUND() {
          const { game, source: plane } = this.eventContext();
          const superGame = game.game();

          this.endRoundTriggered = true;

          for (const port of game.decks.table.getFreePorts()) {
            this.emit('TRIGGER', { target: port });
            const availablePort = superGame.availablePorts[0];
            if (!availablePort) continue;

            superGame.run('putPlaneOnField', availablePort);
            return this.emit('RESET');
          }

          this.emit('CHECK_PLANES_IN_HANDS');
          this.emit('RESET');
        },
      },
      mergeGame(plane) {
        const { game } = this.eventContext();
        const gameId = game.id();
        const superGame = plane.game();
        const bridges = plane.getLinkedBridges();
        const mergedBridge = bridges.find((b) => b.game() === superGame);

        game.set({ merged: true });
        plane.set({ mergedPlane: true });
        mergedBridge.set({ mergedGameId: gameId });

        // переносим все связанные plane-ы
        const processedBridges = [mergedBridge];
        const processBridges = (plane) => {
          const bridges = plane.getLinkedBridges().filter((bridge) => !processedBridges.includes(bridge));
          for (const bridge of bridges) {
            const ports = bridge.getLinkedPorts();
            const [joinPort, targetPort] = ports.sort((a, b) => (a.parent() !== plane ? -1 : 1));
            const joinPlane = joinPort.parent();

            const { targetLinkPoint } = game.run('updatePlaneCoordinates', { joinPort, targetPort });

            joinPlane.game(superGame);
            joinPlane.moveToTarget(superGame.decks.table);

            bridge.updateParent(superGame);
            bridge.set({ left: targetLinkPoint.left, top: targetLinkPoint.top });
            bridge.updateRotation();

            processedBridges.push(bridge);
            processBridges(joinPlane);
          }
        };
        processBridges(plane);

        let turnOrder = superGame.turnOrder.filter((id) => id !== gameId);
        turnOrder.push(gameId);
        superGame.set({ turnOrder });

        const gameCommonDominoDeck = game.find('Deck[domino_common]');
        const gameCommonCardDeck = game.find('Deck[card_common]');
        for (const player of game.players()) {
          player.find('Deck[domino]').moveAllItems({ target: gameCommonDominoDeck, markNew: true });
          player.find('Deck[card]').moveAllItems({ target: gameCommonCardDeck, markNew: true });
        }
      },
    },
    { player }
  );
});
