() => {
  const event = domain.game.events.common.putPlaneFromHand();

  event.init = function () {
    const { game, player, source: card } = this.eventContext();

    const plane = game.addCardPlane(card);
    plane.set({ anchorGameId: player.gameId }); // без установленного anchorGameId внутри moveToTarget он возьмется из sourceGameId
    plane.moveToTarget(player.find('Deck[plane]'));

    player.set({
      eventData: { plane: { [plane.id()]: { mustBePlaced: true } } }
    });

    // поиск должен идти только внутри исходной игры (для корпоративного режима)
    player.game().run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, player);
  };

  return event;
};
