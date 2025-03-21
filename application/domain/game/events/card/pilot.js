() => {
  const event = domain.game.events.common.putPlaneFromHand();

  event.init = function () {
    const { game, player } = this.eventContext();
    const gameDeck = game.find('Deck[plane]');
    const playerDeck = player.find('Deck[plane]');

    if (!gameDeck.itemsCount()) return { resetEvent: true };

    const eventData = { plane: {} };

    for (let i = 0; i < game.settings.planesToChoose; i++) {
      const plane = gameDeck.getRandomItem();
      if (!plane) continue;

      plane.moveToTarget(playerDeck);
      eventData.plane[plane.id()] = { oneOfMany: true };
    }

    player.set({ eventData });
  };
  event.handlers['ADD_PLANE'] = function ({ target: plane }) {
    const { game, player } = this.eventContext();
    const gamePlaneDeck = game.find('Deck[plane]');
    const playerPlaneDeck = player.find('Deck[plane]');
    const planeList = playerPlaneDeck.select('Plane');

    const eventData = { plane: {} };
    eventData.plane[plane.id()] = { oneOfMany: null };
    player.set({ eventData });

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
          player.set({
            eventData: {
              plane: {
                [remainPlane.id()]: { oneOfMany: null }
              }
            }
          });
        }
      }

      this.emit('NO_AVAILABLE_PORTS');
      return { preventListenerRemove: true };
    }
  };

  return event;
};
