(function ({ timerOverdue } = {}) {
  const player = this.roundActivePlayer();

  if (this.status === 'PREPARE_START') {
    this.toggleEventHandlers('END_ROUND', {}, player);
    return;
  }

  if (this.round > 0 && player) player.checkHandDiceLimit();

  this.run('lib.updateRoundStep', { timerOverdue });
});
