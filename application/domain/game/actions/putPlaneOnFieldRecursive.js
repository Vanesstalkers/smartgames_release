(async function ({ planes = [], minFreePorts = 0, fromHand = false }) {
  const MAX_ATTEMPTS = 20;
  const deckOwner = this.roundActivePlayer() || this;
  const planeDeck = deckOwner.matches({ className: 'Game' })
    ? deckOwner.find('Deck[plane_hand]')
    : deckOwner.find('Deck[plane]');

  if (fromHand) planes = planeDeck.items();

  const sortPlanesByPorts = (a, b) => Object.keys(a.portMap).length < Object.keys(b.portMap).length ? -1 : 1;

  const getPlaneFreePorts = plane => {
    const ports = Object.keys(plane.portMap).map(id => this.get(id));
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
      this.run('removeBridge', { bridge });
      if (!plane.cardPlane && bridge.bridgeToCardPlane) {
        const cardPlane = this.get(bridge.linkedPlanesIds.find(id => id !== plane.id()));
        cardPlane.moveToTarget(planeDeck);
        cardPlane.set({ left: 0, top: 0 });
        eventData.plane[cardPlane.id()] = { selectable: null };
      }
    }
  };

  const movePlaneFromTableToHand = () => {
    const planeStates = this.decks.table.getAllItems().reduce((acc, plane) => {
      const linkedPlanes = plane.getLinkedPlanes();
      const nonCardPlanes = linkedPlanes.length - linkedPlanes.filter(p => p.cardPlane).length;
      acc[plane.id()] = nonCardPlanes < 2 ? { selectable: true, mustBePlaced: true } : null;
      return acc;
    }, {});

    deckOwner.set({ eventData: { plane: planeStates } });

    const selectablePlanes = this.decks.table.getAllItems()
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
    extraPlane.moveToTarget(this.find('Deck[plane]'));
    deckOwner.set({ eventData: { plane: { [extraPlane.id()]: { mustBePlaced: true } } } });
    planes.push(extraPlane);
  };

  const freePortsNotEnough = () => {
    const plane = this.getSmartRandomPlaneFromDeck();
    this.run('showPlanePortsAvailability', { joinPlaneId: plane.id() });
    const uniqueFreePorts = new Set(this.availablePorts.map(item => item.targetPortId)).size;
    return this.isCoreGame() && uniqueFreePorts < minFreePorts;
  };

  const putPlaneOnAvailablePort = () => {
    const port = this.availablePorts.sort((a, b) => a.priority > b.priority ? -1 : 1)[0];
    this.run('putPlaneOnField', port);
  };

  let requireExtraPlane = false;
  let attempts = MAX_ATTEMPTS;

  while (planes.length || freePortsNotEnough()) {
    if (--attempts === 0) {
      return this.run('endGame', {
        message: 'Возникла рекурсия, израсходовавшая все ресурсы. Продолжение игры не возможно.'
      });
    }

    if (planes.length === 0) addExtraPlane();

    planes.sort(sortPlanesByPorts);
    const plane = planes.pop();
    this.run('showPlanePortsAvailability', { joinPlaneId: plane.id() });

    if (this.availablePorts.length) {
      putPlaneOnAvailablePort();
    } else {
      const initialFreePorts = this.decks.table.getFreePorts().length;
      movePlaneFromTableToHand();

      this.run('showPlanePortsAvailability', { joinPlaneId: plane.id() });
      if (this.availablePorts.length) {
        putPlaneOnAvailablePort();
      }

      if (initialFreePorts + planeDeck.itemsCount() > this.decks.table.getFreePorts().length) {
        while (this.decks.table.itemsCount() > 0) movePlaneFromTableToHand();

        planes = planeDeck.items();
        if (requireExtraPlane) {
          addExtraPlane();
        } else {
          requireExtraPlane = true;
        }
        planes.sort(sortPlanesByPorts);
        planes.pop().moveToTarget(this.decks.table);
      }
    }

    planes = planeDeck.items();
  }

  deckOwner.set({ eventData: { plane: null } });
});
