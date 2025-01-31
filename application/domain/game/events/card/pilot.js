() => {
  /**
   * в режиме супер игры:
   *    карта из колоды супер-игры:
   *    карта из обычной колоды:
   *      - только к полю команды (кроме блока, связанного с центром)
   */
  const event = domain.game.events.common.putPlaneFromHand();

  event.init = function () {
    const { game, player } = this.eventContext();
    const gameDeck = game.find('Deck[plane]');
    const deck = player.find('Deck[plane]');

    for (let i = 0; i < game.settings.planesToChoose; i++) {
      const plane = gameDeck.getRandomItem();
      if (plane) plane.moveToTarget(deck);
    }
  };
  event.handlers['ADD_PLANE'] = function ({ target: plane }) {
    const { game, player } = this.eventContext();
    const gamePlaneDeck = game.find('Deck[plane]');
    const playerPlaneDeck = player.find('Deck[plane]');
    const planeList = playerPlaneDeck.select('Plane');

    const requiredPlanes = planeList.filter((plane) => plane.eventData.moveToHand);
    const extraPlanes = planeList.filter((plane) => plane.eventData.extraPlane);
    const pilotPlanePlaced =
      planeList.length - requiredPlanes.length - extraPlanes.length <= game.settings.planesToChoose - 1;
    if (requiredPlanes.length === 0 && pilotPlanePlaced) {
      this.emit('RESET');
    } else {
      if (plane.eventData.extraPlane) {
        const extraPlanes = planeList.filter((plane) => plane.eventData.extraPlane);
        if (extraPlanes.length) {
          for (const plane of extraPlanes) {
            plane.moveToTarget(gamePlaneDeck);
          }
        }
      } else if (!plane.eventData.moveToHand) {
        // один из новых блоков для размещения на выбор - остальные можно убрать
        const remainPlane = planeList.find(() => !plane.eventData.moveToHand);
        if (remainPlane) {
          // в колоде мог остаться всего один блок на выбор
          remainPlane.moveToTarget(gamePlaneDeck);
        }
      }

      this.emit('NO_AVAILABLE_PORTS');
      return { preventListenerRemove: true };
    }
  };

  event.handlers['END_ROUND'] = function () {
    this.emit('CHECK_PLANES_IN_HANDS');
    this.emit('RESET');
  };

  return event;
};
