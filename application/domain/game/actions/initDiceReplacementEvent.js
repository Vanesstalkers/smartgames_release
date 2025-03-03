(function ({} = {}, initPlayer) {
  return this.initEvent(domain.game.events.common.diceReplacementEvent(), {
    allowedPlayers: [initPlayer],
  });
});
