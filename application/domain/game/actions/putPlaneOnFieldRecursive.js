(async function ({ planes = [], minFreePorts = 0, fromHand = false }, initPlayer) {
  const MAX_ATTEMPTS = 20;
  const game = this.merged ? this.game() : this; // !!!! если что-то капитально сломается, то game заменить обратно на this
  const superGame = initPlayer.game().game();
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

  const movePlaneFromTableToHand = async () => {
    const planeStates = game.decks.table.getAllItems().reduce((acc, plane) => {
      const linkedPlanes = plane.getLinkedPlanes();
      const nonCardPlanes = linkedPlanes.length - linkedPlanes.filter(p => p.cardPlane).length;
      if (plane.anchorGameId === initPlayer.gameId)
        acc[plane.id()] = nonCardPlanes < 2 ? { selectable: true, mustBePlaced: true } : null;
      return acc;
    }, {});

    deckOwner.set({ eventData: { plane: planeStates } });

    const selectablePlanes = game.decks.table.getAllItems()
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

    await this.saveChanges();
  };

  const addExtraPlane = () => {
    const extraPlane = game.getSmartRandomPlaneFromDeck();
    extraPlane.moveToTarget(game.find('Deck[plane]'));
    deckOwner.set({ eventData: { plane: { [extraPlane.id()]: { mustBePlaced: true } } } });
    planes.push(extraPlane);
  };

  const freePortsNotEnough = () => {
    const plane = game.getSmartRandomPlaneFromDeck();
    game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, initPlayer);
    const uniqueFreePorts = new Set(game.availablePorts.map(item => item.targetPortId)).size;
    return game.isCoreGame() && uniqueFreePorts < minFreePorts;
  };

  const putPlaneOnAvailablePort = async () => {
    const port = game.availablePorts.sort((a, b) => a.priority > b.priority ? -1 : 1)[0];
    game.run('putPlaneOnField', port);
    await this.saveChanges();
  };

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

    const availablePorts = game.availablePorts.filter((placementConfig) => {
      const targetPlane = superGame.get(placementConfig.targetPlaneId);
      return targetPlane.anchorGameId === initPlayer.gameId;
    });
    game.set({ availablePorts });

    if (game.availablePorts.length) {
      await putPlaneOnAvailablePort();
    } else {
      const initialFreePorts = game.decks.table.getFreePorts().length;
      await movePlaneFromTableToHand();

      game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, initPlayer);
      const availablePorts = game.availablePorts.filter((placementConfig) => {
        const targetPlane = superGame.get(placementConfig.targetPlaneId);
        return targetPlane.anchorGameId === initPlayer.gameId;
      });
      game.set({ availablePorts });
      
      if (game.availablePorts.length) {
        await putPlaneOnAvailablePort();
      }

      if (initialFreePorts + planeDeck.itemsCount() > game.decks.table.getFreePorts().length) {
        const n = initPlayer.game().merged ? 1 : 0; // точку привязки не трогаем
        while (game.decks.table.items().filter(p => p.anchorGameId === initPlayer.gameId).length > n) {
          await movePlaneFromTableToHand();
        }

        planes = planeDeck.items();
        if (requireExtraPlane) {
          addExtraPlane();
        } else {
          requireExtraPlane = true;
        }
        planes.sort(sortPlanesByPorts);
        planes.pop().moveToTarget(game.decks.table);
      }
    }

    await this.saveChanges();
    planes = planeDeck.items();
  }

  deckOwner.set({ eventData: { plane: null } });
  game.set({ availablePorts: [] });
});
