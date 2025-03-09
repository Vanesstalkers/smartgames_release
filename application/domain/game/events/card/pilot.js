() => {
  const event = domain.game.events.common.putPlaneFromHand();

  event.init = function () {
    const { game, player } = this.eventContext();
    const gameDeck = game.find('Deck[plane]');
    const deck = player.find('Deck[plane]');

    if (!gameDeck.itemsCount()) return { resetEvent: true };

    for (let i = 0; i < game.settings.planesToChoose; i++) {
      const plane = gameDeck.getRandomItem();
      if (plane) {
        plane.moveToTarget(deck);
        plane.addCustomClass('one-of-many');
      }
    }
  };
  event.handlers['ADD_PLANE'] = function ({ target: plane }) {
    const { game, player } = this.eventContext();
    const gamePlaneDeck = game.find('Deck[plane]');
    const playerPlaneDeck = player.find('Deck[plane]');
    const planeList = playerPlaneDeck.select('Plane');

    plane.removeCustomClass('one-of-many');

    const requiredPlanes = planeList.filter((planeItem) =>
      player.eventData.plane?.[planeItem.id()]?.mustBePlaced
    );
    const extraPlanes = planeList.filter((planeItem) =>
      player.eventData.plane?.[planeItem.id()]?.extraPlane
    );

    const pilotPlanePlaced =
      planeList.length - requiredPlanes.length - extraPlanes.length <= game.settings.planesToChoose - 1;
    if (requiredPlanes.length === 0 && pilotPlanePlaced) {
      this.emit('RESET');
    } else {
      if (player.eventData.plane?.[plane.id()]?.extraPlane) {
        if (extraPlanes.length) {
          for (const extraPlane of extraPlanes) {
            extraPlane.moveToTarget(gamePlaneDeck);
          }
        }
      } else if (!player.eventData.plane?.[plane.id()]?.mustBePlaced) {
        // один из новых блоков для размещения на выбор - остальные можно убрать
        const remainPlane = planeList.find((planeItem) =>
          !player.eventData.plane?.[planeItem.id()]?.mustBePlaced
        );
        if (remainPlane) {
          remainPlane.moveToTarget(gamePlaneDeck);
          remainPlane.removeCustomClass('one-of-many');
        }
      }

      this.emit('NO_AVAILABLE_PORTS');
      return { preventListenerRemove: true };
    }
  };

  return event;
};
