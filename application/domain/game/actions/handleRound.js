(function ({ notUserCall } = {}) {
  const players = this.players();

  const initPlayer = !notUserCall ? this.getActivePlayer() : null;

  if (initPlayer) {
    this.toggleEventHandlers('END_ROUND', {}, initPlayer);
    initPlayer.deactivate();
  }

  if (!this.checkPlayersReady()) return; // ждем завершения хода всеми игроками

  this.toggleEventHandlers(this.roundStep, {}, players);

  const roundStepsFunc = domain.game.actions.games?.[this.gameType].roundSteps || domain.game.actions.roundSteps;
  if (!roundStepsFunc) throw `Round steps for "${this.gameType}" game not found.`;

  const { newRoundLogEvents, statusLabel, newRoundNumber } = roundStepsFunc.call(this, { initPlayer });

  // обновляем логи
  for (const logEvent of newRoundLogEvents) this.logs(logEvent);
  this.set({ statusLabel: statusLabel || `Раунд ${newRoundNumber}`, round: newRoundNumber });
  this.dumpState();
});
