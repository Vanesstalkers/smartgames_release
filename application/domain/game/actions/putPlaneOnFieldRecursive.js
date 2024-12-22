(function ({ planes, minFreePorts }) {
  const deckOwner = this.roundActivePlayer() || this;
  const planeDeck = deckOwner.matches({ className: 'Game' })
    ? deckOwner.find('Deck[plane_hand]')
    : deckOwner.find('Deck[plane]');

  const addExtraPlane = () => {
    const extraPlane = this.getSmartRandomPlaneFromDeck();
    if (extraPlane) {
      const gamePlaneDeck = this.find('Deck[plane]');
      extraPlane.moveToTarget(gamePlaneDeck);
      extraPlane.set({ eventData: { moveToHand: true } });
      planes.push(extraPlane);
    } else {
      throw 'endGame'; // проиграли все
    }
  };

  const freePortsNotEnough = () => {
    const plane = this.getSmartRandomPlaneFromDeck();
    this.run('showPlanePortsAvailability', { joinPlaneId: plane.id() });
    const freePortsCount = new Set(this.availablePorts.map((item) => item.targetPortId)).size;
    return this.isCoreGame() && freePortsCount < minFreePorts;
  };

  let repeatCounterForAddingExtraPlanesInHand = 0;
  while (planes.length || freePortsNotEnough()) {
    if (planes.length === 0) {
      try {
        addExtraPlane();
      } catch (e) {
        if (e === 'endGame') return this.run('endGame');
        throw e;
      }
    }

    const prevLength = planes.length;
    const plane = planes.pop();

    const joinPlaneId = plane.id();
    this.run('showPlanePortsAvailability', { joinPlaneId });
    if (this.availablePorts.length) {
      this.run('putPlaneOnField', this.availablePorts[0]);
    } else {
      {
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
      }

      const selectablePlanes = this.decks.table.getAllItems().filter(({ eventData }) => eventData.selectable);

      {
        // аналог TRIGGER из events/card/pilot
        const plane = selectablePlanes[0];
        plane.moveToTarget(planeDeck);
        plane.set({ left: 0, top: 0, eventData: { selectable: null } });

        const linkedBridges = plane.getLinkedBridges();
        for (const bridge of linkedBridges) {
          this.run('removeBridge', { bridge });

          if (!plane.cardPlane && bridge.bridgeToCardPlane) {
            const cardPlaneId = bridge.linkedPlanesIds.find((id) => id !== plane.id());
            const cardPlane = this.get(cardPlaneId);
            cardPlane.moveToTarget(planeDeck);
            cardPlane.set({ left: 0, top: 0, eventData: { selectable: null } });
          }
        }
      }

      this.run('showPlanePortsAvailability', { joinPlaneId });
      if (this.availablePorts.length) {
        this.run('putPlaneOnField', this.availablePorts[0]);
      }
    }

    planes = planeDeck.getAllItems();
    planes.sort(({ portMap: a }, { portMap: b }) => {
      return Object.keys(a).length < Object.keys(b).length ? -1 : 1;
    });
    if (prevLength === planes.length) {
      repeatCounterForAddingExtraPlanesInHand++;
      if (repeatCounterForAddingExtraPlanesInHand > 20)
        throw new Error('Игра не может быть начата по техническим причинам (repeatCounterForAddingExtraPlanesInHand)');
      this.run('showPlanePortsAvailability', { joinPlaneId: planes[planes.length - 1].id() });
      if (this.availablePorts.length) continue;

      try {
        addExtraPlane();
      } catch (e) {
        if (e === 'endGame') return this.run('endGame');
        throw e;
      }
    }

    this.decks.table.updateAllItems({
      eventData: { selectable: null, moveToHand: null },
    });
  }
});
