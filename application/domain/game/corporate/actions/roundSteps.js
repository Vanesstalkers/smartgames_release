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

  const smartMoveRandomCardTarget =
    this.settings.roundStartCardAddToPlayerHand || this.mergeStatus() === 'freezed'
      ? player.find('Deck[card]')
      : this.decks.active;

  if (superGame.allGamesMerged()) {
    superGame.run('smartMoveRandomCard', { target: smartMoveRandomCardTarget });
  } else {
    this.run('smartMoveRandomCard', { target: smartMoveRandomCardTarget });
  }

  // обновляем таймер
  const actionsDisabled = player.eventData.actionsDisabled === true;
  const timerConfig = actionsDisabled ? { time: 5 } : null;
  this.set({ lastRoundTimerConfig: timerConfig }); // нужно для восстановления игры
  player.activate(); // делаем строго после проверки actionsDisabled (внутри activate значение сбросится)

  return { newRoundLogEvents, newRoundNumber };
});
