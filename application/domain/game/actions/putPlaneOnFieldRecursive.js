(/* async */ function ({ planes = [], minFreePorts = 0, fromHand = false }, initPlayer) {
  const MAX_ATTEMPTS = 50;
  const game = this.merged ? this.game() : this;
  const deckOwner = game.roundActivePlayer() || game;
  const planeDeck = deckOwner.matches({ className: 'Game' })
    ? deckOwner.find('Deck[plane_hand]')
    : deckOwner.find('Deck[plane]');

  if (fromHand) planes = planeDeck.items();

  const sortPlanesByPorts = (a, b) => a.portsCount() < b.portsCount() ? -1 : 1;

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
      if (!plane.anchorGameId // НЕ корпоративная игра
        || plane.anchorGameId === initPlayer?.gameId) // корпоративная игра (в putStartPlanes нет initPlayer)
        acc[plane.id()] = nonCardPlanes < 2 ? { selectable: true, mustBePlaced: true } : null;
      return acc;
    }, {});

    deckOwner.set({ eventData: { plane: planeStates } });

    const selectablePlanes = game.decks.table.items()
      .filter(p => deckOwner.eventData.plane?.[p.id()]?.selectable && !p.mergedPlane)
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
    const extraPlane = this.getSmartRandomPlaneFromDeck({ forceSearch: true });
    extraPlane.moveToTarget(game.find('Deck[plane]'));
    deckOwner.set({ eventData: { plane: { [extraPlane.id()]: { mustBePlaced: true } } } });
    planes.push(extraPlane);
  };

  const freePortsNotEnough = () => {
    const plane = this.getSmartRandomPlaneFromDeck({ forceSearch: true });
    const availablePorts = game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, initPlayer);
    const uniqueFreePorts = new Set(availablePorts.map(item => item.targetPortId)).size;
    return game.isCoreGame() && uniqueFreePorts < minFreePorts;
  };

  const putPlaneOnAvailablePort = (availablePorts) => {
    const port = availablePorts.sort((a, b) => a.priority > b.priority ? -1 : 1)[0];
    game.run('putPlaneOnField', port, initPlayer);
  };

  game.toggleEventHandlers('ADD_PLANE_RECURSIVE_STARTED');

  let requireExtraPlane = false;
  let attempts = MAX_ATTEMPTS;

  while (planes.length || freePortsNotEnough()) {
    // await debug()
    if (--attempts === 0) {
      return game.run('endGame', {
        msg: { lose: 'Возникла рекурсия, израсходовавшая все ресурсы. Продолжение игры не возможно.' },
      });
    }

    if (planes.length === 0) addExtraPlane();
    // await debug()
    planes.sort(sortPlanesByPorts);
    const plane = planes.pop();
    const availablePorts = game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, initPlayer);
    // await debug()
    if (availablePorts.length) {
      putPlaneOnAvailablePort(availablePorts);
      // await debug()
    } else if (game.decks.table.itemsCount() === 1) {
      // был добавлен plane на пустое поле (через вызов NO_AVAILABLE_PORTS внутри showPlanePortsAvailability)
    } else {
      const initialFreePorts = game.decks.table.getFreePorts().length;
      movePlaneFromTableToHand();
      // await debug()
      const availablePorts = game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, initPlayer);
      // await debug()
      if (availablePorts.length) {
        putPlaneOnAvailablePort(availablePorts);
        // await debug()
      }

      // делаем через initialFreePorts, чтобы не пришлось проверять фактическую доступность каждого port-а (может быть заблокирован plane-ами на игровом поле)
      if (initialFreePorts + planeDeck.itemsCount() > game.decks.table.getFreePorts().length) {
        while (game.decks.table.items().filter(
          p => !p.anchorGameId // НЕ корпоративная игра
            || ( // корпоративная игра
              p.anchorGameId === initPlayer?.gameId && // в putStartPlanes нет initPlayer
              !p.mergedPlane // точку привязки не трогаем
            )
        ).length > 0) {
          movePlaneFromTableToHand();
          // await debug()
        }

        planes = planeDeck.items();
        if (requireExtraPlane) {
          addExtraPlane();
          // await debug()
        } else {
          requireExtraPlane = true;
        }

        const plane = planes.sort(sortPlanesByPorts).pop();
        if (this.merged) {
          // цепляемся к оставшемуся на поле mergedPlane
          const availablePorts = game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, initPlayer);
          // await debug()
          if (availablePorts.length) putPlaneOnAvailablePort(availablePorts);
          // await debug()
        } else {
          // выкладываем на пустое поле
          plane.moveToTarget(game.decks.table);
          // await debug()
        }
      }
    }

    planes = planeDeck.items();
  }

  initPlayer?.set({ eventData: { availablePorts: [] } }); // в putStartPlanes нет initPlayer

  const eventData = { plane: {} };
  for (const plane of game.decks.table.items()) {
    eventData.plane[plane.id()] = { selectable: null, oneOfMany: null, mustBePlaced: null, extraPlane: null };
  }
  deckOwner.set({ eventData });

  game.toggleEventHandlers('ADD_PLANE_RECURSIVE_ENDED');
});
