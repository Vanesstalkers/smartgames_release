(async function ({ planes = [], minFreePorts = 0, fromHand = false }) {
  const deckOwner = this.roundActivePlayer() || this;
  const planeDeck = deckOwner.matches({ className: 'Game' })
    ? deckOwner.find('Deck[plane_hand]')
    : deckOwner.find('Deck[plane]');
  if (fromHand) planes = planeDeck.items();

  const movePlaneFromTableToHand = () => {
    // аналог NO_AVAILABLE_PORTS из events/card/pilot
    for (const plane of this.decks.table.getAllItems()) {
      const linkedPlanes = plane.getLinkedPlanes();
      const linkedCardPlanes = linkedPlanes.filter(({ cardPlane }) => cardPlane);
      const eventData =
        linkedPlanes.length - linkedCardPlanes.length < 2
          ? { selectable: true, moveToHand: true }
          : { selectable: null, moveToHand: null };
      plane.set({ eventData });
    }

    const selectablePlanes = this.decks.table.getAllItems().filter(({ eventData }) => eventData.selectable);
    // !!! сомнительная логика - все равно не учитывает свободные, но заблокированные порты
    selectablePlanes.sort(({ portMap: a }, { portMap: b }) => {
      const portsA = Object.keys(a).map((id) => this.get(id));
      const freePortsA = portsA.filter((port) => !port.linkedBridgeCode);
      const portsB = Object.keys(b).map((id) => this.get(id));
      const freePortsB = portsB.filter((port) => !port.linkedBridgeCode);
      return freePortsA.length === freePortsB.length
        ? portsA.length < portsB.length
          ? -1
          : 1
        : freePortsA.length < freePortsB.length
        ? -1
        : 1;
    });
    const plane = selectablePlanes[0]; // наименьшее количество port-ов

    if (!plane) {
      return;
    }

    const linkedBridges = plane.getLinkedBridges();
    for (const bridge of linkedBridges) {
      try {
        this.run('removeBridge', { bridge });
      } catch (err) {
        const e = err;
        throw err;
      }
      if (!plane.cardPlane && bridge.bridgeToCardPlane) {
        const cardPlaneId = bridge.linkedPlanesIds.find((id) => id !== plane.id());
        const cardPlane = this.get(cardPlaneId);
        cardPlane.moveToTarget(planeDeck);
        cardPlane.set({ left: 0, top: 0, eventData: { selectable: null } });
      }
    }

    plane.moveToTarget(planeDeck);
    plane.set({ left: 0, top: 0, eventData: { selectable: null } });
  };

  const addExtraPlane = () => {
    const gamePlaneDeck = this.find('Deck[plane]');
    const extraPlane = this.getSmartRandomPlaneFromDeck();

    extraPlane.moveToTarget(gamePlaneDeck);
    extraPlane.set({ eventData: { moveToHand: true } });

    planes.push(extraPlane);
  };

  const freePortsNotEnough = () => {
    const plane = this.getSmartRandomPlaneFromDeck();
    this.run('showPlanePortsAvailability', { joinPlaneId: plane.id() });
    const freePortsCount = new Set(this.availablePorts.map((item) => item.targetPortId)).size;
    return this.isCoreGame() && freePortsCount < minFreePorts;
  };

  let requireExtraPlane = false;
  while (planes.length || freePortsNotEnough()) {
    // freePortsNotEnough
    if (planes.length === 0) {
      addExtraPlane();
    }

    planes.sort(({ portMap: a }, { portMap: b }) => {
      return Object.keys(a).length < Object.keys(b).length ? -1 : 1;
    });
    const plane = planes.pop();
    const joinPlaneId = plane.id();

    this.run('showPlanePortsAvailability', { joinPlaneId });
    if (this.availablePorts.length) {
      const port = this.availablePorts.sort((a, b) => (a.priority > b.priority ? -1 : 1))[0];
      this.run('putPlaneOnField', port);
    } else {
      const freePorts = this.decks.table.getFreePortsCount();
      movePlaneFromTableToHand();

      this.run('showPlanePortsAvailability', { joinPlaneId });
      if (this.availablePorts.length) {
        const port = this.availablePorts.sort((a, b) => (a.priority > b.priority ? -1 : 1))[0];
        this.run('putPlaneOnField', port);
      }
      if (freePorts + planeDeck.itemsCount() > this.decks.table.getFreePortsCount()) {
        while (this.decks.table.itemsCount() > 0) {
          movePlaneFromTableToHand();
        }

        planes = planeDeck.items();
        if (requireExtraPlane) {
          addExtraPlane();
        } else {
          requireExtraPlane = true;
        }
        planes.sort(({ portMap: a }, { portMap: b }) => {
          return Object.keys(a).length < Object.keys(b).length ? -1 : 1;
        });
        planes.pop().moveToTarget(this.decks.table);
      }
    }

    // делаем в конце, т.к. может прийти массив во входящих аргументах
    planes = planeDeck.items();

    this.decks.table.updateAllItems({
      eventData: { selectable: null, moveToHand: null },
    });
  }
});
