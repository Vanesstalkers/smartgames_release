(function ({ planes = [], minFreePorts = 0, fromHand = false }, initPlayer) {
  const MAX_ATTEMPTS = 20;
  const game = this.merged ? this.game() : this;
  const deckOwner = game.roundActivePlayer() || game;
  const planeDeck = deckOwner.matches({ className: 'Game' })
    ? deckOwner.find('Deck[plane_hand]')
    : deckOwner.find('Deck[plane]');

  if (fromHand) planes = planeDeck.items();

  const sortPlanesByPorts = (a, b) => Object.keys(a.portMap).length < Object.keys(b.portMap).length ? -1 : 1;

  const getPlaneFreePorts = plane => {
    const ports = Object.keys(plane.portMap).map(id => game.get(id));
    return ports.filter(port => !port.linkedBridgeCode);
  };

  const sortSelectablePlanes = (a, b) => {
    const portsA = getPlaneFreePorts(a);
    const portsB = getPlaneFreePorts(b);
    return portsA.length === portsB.length
      ? sortPlanesByPorts(a, b)
      : portsA.length < portsB.length ? -1 : 1;
  };

  const removeBridgesAndUpdateState = (plane, eventData) => {
    const linkedBridges = plane.getLinkedBridges();
    for (const bridge of linkedBridges) {
      game.run('removeBridge', { bridge });
      if (!plane.cardPlane && bridge.bridgeToCardPlane) {
        const cardPlane = game.get(bridge.linkedPlanesIds.find(id => id !== plane.id()));
        cardPlane.moveToTarget(planeDeck);
        cardPlane.set({ left: 0, top: 0 });
        eventData.plane[cardPlane.id()] = { selectable: null };
      }
    }
  };

  const movePlaneFromTableToHand = () => {
    const planeStates = game.decks.table.items().reduce((acc, plane) => {
      const linkedPlanes = plane.getLinkedPlanes();
      const nonCardPlanes = linkedPlanes.length - linkedPlanes.filter(p => p.cardPlane).length;
      if (plane.anchorGameId === initPlayer.gameId)
        acc[plane.id()] = nonCardPlanes < 2 ? { selectable: true, mustBePlaced: true } : null;
      return acc;
    }, {});

    deckOwner.set({ eventData: { plane: planeStates } });

    const selectablePlanes = game.decks.table.items()
      .filter(plane => deckOwner.eventData.plane?.[plane.id()]?.selectable)
      .sort(sortSelectablePlanes);

    if (selectablePlanes.length === 0) return;

    const eventData = { plane: {} };
    const plane = selectablePlanes[0];

    removeBridgesAndUpdateState(plane, eventData);
    plane.moveToTarget(planeDeck);
    plane.set({ left: 0, top: 0 });
    eventData.plane[plane.id()] = { selectable: null };
    deckOwner.set({ eventData });
  };

  const addExtraPlane = () => {
    const extraPlane = this.getSmartRandomPlaneFromDeck();
    extraPlane.moveToTarget(game.find('Deck[plane]'));
    deckOwner.set({ eventData: { plane: { [extraPlane.id()]: { mustBePlaced: true } } } });
    planes.push(extraPlane);
  };

  const freePortsNotEnough = () => {
    const plane = this.getSmartRandomPlaneFromDeck();
    game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, initPlayer);
    const uniqueFreePorts = new Set(game.availablePorts.map(item => item.targetPortId)).size;
    return game.isCoreGame() && uniqueFreePorts < minFreePorts;
  };

  const putPlaneOnAvailablePort = () => {
    const port = game.availablePorts.sort((a, b) => a.priority > b.priority ? -1 : 1)[0];
    game.run('putPlaneOnField', port);
  };

  game.toggleEventHandlers('ADD_PLANE_RECURSIVE_STARTED');

  let requireExtraPlane = false;
  let attempts = MAX_ATTEMPTS;

  while (planes.length || freePortsNotEnough()) {
    if (--attempts === 0) {
      return game.run('endGame', {
        msg: { lose: 'Возникла рекурсия, израсходовавшая все ресурсы. Продолжение игры не возможно.' },
      });
    }

    if (planes.length === 0) addExtraPlane();

    planes.sort(sortPlanesByPorts);
    const plane = planes.pop();
    game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, initPlayer);

    if (game.availablePorts.length) {
      putPlaneOnAvailablePort();
    } else if (game.decks.table.itemsCount() === 1) {
      // был добавлен plane на пустое поле (через вызов NO_AVAILABLE_PORTS внутри showPlanePortsAvailability)
    } else {
      const initialFreePorts = game.decks.table.getFreePorts().length;
      movePlaneFromTableToHand();

      game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, initPlayer);

      if (game.availablePorts.length) {
        putPlaneOnAvailablePort();
      }

      if (initialFreePorts + planeDeck.itemsCount() > game.decks.table.getFreePorts().length) {
        while (game.decks.table.items().filter(
          p => p.anchorGameId === initPlayer.gameId &&
            !p.mergedPlane // точку привязки не трогаем
        ).length > 0) {
          movePlaneFromTableToHand();
        }

        planes = planeDeck.items();
        if (requireExtraPlane) {
          addExtraPlane();
        } else {
          requireExtraPlane = true;
        }

        const plane = planes.sort(sortPlanesByPorts).pop();
        if (this.merged) {
          // цепляемся к оставшемуся на поле mergedPlane
          game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, initPlayer);
          if (game.availablePorts.length) putPlaneOnAvailablePort();
        } else {
          // выкладываем на пустое поле
          plane.moveToTarget(game.decks.table);
        }
      }
    }

    planes = planeDeck.items();
  }

  game.set({ availablePorts: [] });

  const eventData = { plane: {} };
  for (const plane of game.decks.table.items()) {
    eventData.plane[plane.id()] = { selectable: null, oneOfMany: null, mustBePlaced: null, extraPlane: null };
  }
  deckOwner.set({ eventData });

  game.toggleEventHandlers('ADD_PLANE_RECURSIVE_ENDED');
});
