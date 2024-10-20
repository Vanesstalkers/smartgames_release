(function ({ notUserCall, timerOverdue } = {}) {
  if (this.status === 'PREPARE_START') {
    const initPlayer = !notUserCall ? this.getActivePlayer() : undefined;
    this.toggleEventHandlers('END_ROUND', {}, initPlayer);
  } else {
    this.run('lib.handleRound', { notUserCall, timerOverdue });
  }
});
