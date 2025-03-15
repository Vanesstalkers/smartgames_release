(function ({} = {}, initPlayer) {
  return this.initEvent({
    name: 'initDiceReplacementEvent',
    ...domain.game.events.common.diceReplacementEvent()
  }, {
    allowedPlayers: [initPlayer],
  });
});
