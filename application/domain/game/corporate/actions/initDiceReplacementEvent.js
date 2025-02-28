(function () {
  const event = domain.game.events.common.diceReplacementEvent();
  
  event.disableZoneParent = function (parent) {
    this.disabledZoneParents.add(parent);

    parent.set({
      eventData: {
        actionsDisabled:
          'Действия с этим блоком игрового поля запрещены, до тех пор пока не будет завершена замена костяшек.',
      },
    });

    const game = parent.game();
    const superGame = game.isSuperGame ? game : game.game();
    superGame.broadcastEvent('GAME_FIELD_DISABLED', { zoneParent: parent });
  };

  return this.initEvent(event, {
    allowedPlayers: this.hasSuperGame ? this.game().players() : this.players(),
  });
});
