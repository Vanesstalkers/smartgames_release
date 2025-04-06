(function ({ timerOverdue } = {}) {
  const player = this.roundActivePlayer();

  if (this.status === 'PREPARE_START') {
    this.toggleEventHandlers('END_ROUND', {}, player);
    return;
  }

  let timerOverdueCounter = this.timerOverdueCounter || 0;
  if (timerOverdue) {
    timerOverdueCounter++;
    // если много ходов было завершено по таймауту, то скорее всего все игроки вышли и ее нужно завершать
    if (timerOverdueCounter > this.settings.autoFinishAfterRoundsOverdue) {
      console.error('endGame <- timerOverdue');
      this.run('endGame');
    }
  } else {
    timerOverdueCounter = 0;
  }
  this.set({ timerOverdueCounter });

  const activePlayer = this.roundActivePlayer();
  if (activePlayer) this.toggleEventHandlers('END_ROUND', {}, activePlayer);

  if (this.round > 0 && player) player.checkHandDiceLimit(); // делаем принципиально после END_ROUND - могут сработать карты получения dice в руку

  this.run('roundStart'); // если убирать это отсюда, то нужно не забыть про handleAction по кнопке с фронта
});
