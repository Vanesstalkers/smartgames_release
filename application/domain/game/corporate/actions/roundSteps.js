(function () {
  if (this.isSuperGame) return;

  const superGame = this.game();
  const player = this.selectNextActivePlayer();

  this.find('Deck[domino]').moveRandomItems({
    count: 1,
    target: player.find('Deck[domino]'),
  });

  const newRoundNumber = this.round + 1;
  const newRoundLogEvents = [];
  newRoundLogEvents.push(`<team team="${this.templates.code || 'super'}">Начало раунда №${newRoundNumber}.</team>`);

  const playerCardHand = player.find('Deck[card]');
  if (this.gameConfig === 'cooperative') {
    const target =
      this.settings.roundStartCardAddToPlayerHand || this.mergeStatus() === 'freezed'
        ? playerCardHand
        : this.decks.active;

    if (superGame.allGamesMerged()) {
      superGame.run('smartMoveRandomCard', { target });
    } else {
      this.run('smartMoveRandomCard', { target });
    }
  } else {
    const target = playerCardHand;
    if (this.merged) {
      superGame.run('smartMoveRandomCard', { target });
    } else {
      this.run('smartMoveRandomCard', { target });
    }
  }

  // обновляем таймер
  const actionsDisabled = player.eventData.actionsDisabled === true;
  const timerConfig = actionsDisabled ? { time: 5 } : null;
  this.set({ lastRoundTimerConfig: timerConfig }); // нужно для восстановления игры
  player.activate(); // делаем строго после проверки actionsDisabled (внутри activate значение сбросится)

  return { newRoundLogEvents, newRoundNumber };
});
