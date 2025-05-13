(function ({}, initPlayer) {
  const event = domain.game.events.common.diceReplacementEvent();

  event.disableZoneParent = function (parent) {
    this.disabledZoneParents.add(parent);

    const game = parent.game();
    const superGame = game.isSuperGame ? game : game.game();
    superGame.broadcastEvent('DICES_DISABLED', { parent });
  };

  return this.initEvent({
    name: 'initDiceReplacementEvent',
    ...event
  }, {
    player: initPlayer,
    allowedPlayers: this.hasSuperGame ? this.game().players() : this.players(),
  });
});
