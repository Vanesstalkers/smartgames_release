(function () {
  const player = this.roundActivePlayer();
  const game = this.merged ? this.game() : this;
  game.toggleEventHandlers('TRIGGER_EXTRA_PLANE', {}, player);
});
