(function () {
  const deck = this.find('Deck[card]');
  const playedCards = this.decks.drop.select('Card');
  for (const card of playedCards) {
    if (card.restoreAvailable()) card.moveToTarget(deck);
  }
  if (!this.isSinglePlayer()) return;

  const player = this.getActivePlayer();
  const playerPlaneDeck = player.find('Deck[plane]');
  const gamePlaneDeck = this.find('Deck[plane]');

  let planes = [gamePlaneDeck.getRandomItem()];
  while (planes.length) {
    const prevLength = planes.length;
    const plane = planes
      .sort(({ portMap: a }, { portMap: b }) => {
        return Object.keys(a).length < Object.keys(b).length ? -1 : 1;
      })
      .pop();

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
        plane.moveToTarget(playerPlaneDeck);
        plane.set({ left: 0, top: 0, eventData: { selectable: null } });

        const linkedBridges = plane.getLinkedBridges();
        for (const bridge of linkedBridges) {
          this.run('removeBridge', { bridge });

          if (!plane.cardPlane && bridge.bridgeToCardPlane) {
            const cardPlaneId = bridge.linkedPlanesIds.find((id) => id !== plane.id());
            const cardPlane = this.get(cardPlaneId);
            cardPlane.moveToTarget(playerPlaneDeck);
            cardPlane.set({ left: 0, top: 0, eventData: { selectable: null } });
          }
        }
      }

      this.run('showPlanePortsAvailability', { joinPlaneId });
      if (this.availablePorts.length) {
        this.run('putPlaneOnField', this.availablePorts[0]);
      }
    }

    planes = playerPlaneDeck.getAllItems();
    if (prevLength === planes.length) {
      const planeDeck = this.find('Deck[plane]');
      const extraPlane = planeDeck
        .getAllItems()
        .sort(({ portMap: a }, { portMap: b }) => {
          return Object.keys(a).length < Object.keys(b).length ? -1 : 1;
        })
        .pop();
      if (extraPlane) {
        extraPlane.moveToTarget(playerPlaneDeck);
        extraPlane.set({ eventData: { moveToHand: true } });
        planes.push(extraPlane);
      } else {
        return this.run('endGame'); // проиграли все
      }
    }

    this.decks.table.updateAllItems({
      eventData: { selectable: null, moveToHand: null },
    });
  }
});
