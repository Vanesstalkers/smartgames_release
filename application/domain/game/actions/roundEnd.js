(function ({ timerOverdue } = {}) {
  const player = this.roundActivePlayer();

  if (this.status === 'PREPARE_START') {
    this.toggleEventHandlers('END_ROUND', {}, player);
    return;
  }

  this.updateTimerOverdueCounter(timerOverdue);

  if (player) {
    this.toggleEventHandlers('END_ROUND', {}, player);
    player.deactivate();

    if (this.round > 0) player.checkHandDiceLimit(); // делаем принципиально после END_ROUND - могут сработать карты получения dice в руку
  }

  this.dropPlayedCards();
  this.checkCrutches();

  this.run('roundStart'); // если убирать это отсюда, то нужно не забыть про handleAction по кнопке с фронта
});
