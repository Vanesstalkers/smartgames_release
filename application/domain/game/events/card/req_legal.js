() => {
  const event = domain.game.events.common.putPlaneFromHand();

  event.init = function () {
    const { game, player, source: card } = this.eventContext();

    const plane = game.addCardPlane(card);

    plane.moveToTarget(player.find('Deck[plane]'));
    plane.set({ eventData: { moveToHand: true } });
    
    game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, player);
  };

  return event;
};
