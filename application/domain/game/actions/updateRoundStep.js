(function ({ timerOverdue } = {}) {
  if (this.status === 'PREPARE_START') {
    const initPlayer = this.roundActivePlayer();
    this.toggleEventHandlers('END_ROUND', {}, initPlayer);
    return;
  }

  this.run('lib.updateRoundStep', { timerOverdue });
});
