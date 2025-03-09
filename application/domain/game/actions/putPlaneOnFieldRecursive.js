(async function ({ planes = [], minFreePorts = 0, fromHand = false }) {
  const deckOwner = this.roundActivePlayer() || this;
  const planeDeck = deckOwner.matches({ className: 'Game' })
    ? deckOwner.find('Deck[plane_hand]') // фиктивная рука, в которую возвращаются блоки, которые не удалось разместить при создании поля на старте игры
    : deckOwner.find('Deck[plane]');
  if (fromHand) planes = planeDeck.items();

  const movePlaneFromTableToHand = () => {
    // аналог NO_AVAILABLE_PORTS из events/card/pilot
    let eventData = { plane: {} };

    for (const plane of this.decks.table.getAllItems()) {
      const linkedPlanes = plane.getLinkedPlanes();
      const linkedCardPlanes = linkedPlanes.filter((p) => p.cardPlane);

      const canBeRemovedFromField = linkedPlanes.length - linkedCardPlanes.length < 2;
      eventData.plane[plane.id()] = canBeRemovedFromField ? {
        selectable: true,
        mustBePlaced: true
      } : null;
    }

    deckOwner.set({ eventData });

    const selectablePlanes = this.decks.table.getAllItems().filter((plane) =>
      deckOwner.eventData.plane?.[plane.id()]?.selectable
    );

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

    eventData = { plane: {} };
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
        cardPlane.set({ left: 0, top: 0 });
        eventData.plane[cardPlane.id()] = { selectable: null };
      }
    }

    plane.moveToTarget(planeDeck);
    plane.set({ left: 0, top: 0 });

    eventData.plane[plane.id()] = { selectable: null };
    deckOwner.set({ eventData });
  };

  const addExtraPlane = () => {
    const gamePlaneDeck = this.find('Deck[plane]');
    const extraPlane = this.getSmartRandomPlaneFromDeck();

    extraPlane.moveToTarget(gamePlaneDeck);
    deckOwner.set({
      eventData: { plane: { [extraPlane.id()]: { mustBePlaced: true } } }
    });

    planes.push(extraPlane);
  };

  const freePortsNotEnough = () => {
    const plane = this.getSmartRandomPlaneFromDeck();
    this.run('showPlanePortsAvailability', { joinPlaneId: plane.id() });
    const freePortsCount = new Set(this.availablePorts.map((item) => item.targetPortId)).size;
    return this.isCoreGame() && freePortsCount < minFreePorts;
  };

  let requireExtraPlane = false;
  let attempts = 20;
  while (planes.length || freePortsNotEnough()) {
    if (--attempts === 0) {
      return this.run('endGame', {
        message: 'Возникла рекурсия, израсходовавшая все ресурсы. Продолжение игры не возможно.',
      });
    }

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
      const freePortsCount = this.decks.table.getFreePorts().length;
      movePlaneFromTableToHand();

      this.run('showPlanePortsAvailability', { joinPlaneId });
      if (this.availablePorts.length) {
        const port = this.availablePorts.sort((a, b) => (a.priority > b.priority ? -1 : 1))[0];
        this.run('putPlaneOnField', port);
      }
      if (freePortsCount + planeDeck.itemsCount() > this.decks.table.getFreePorts().length) {
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
  }

  deckOwner.set({ eventData: { plane: null } });
});
