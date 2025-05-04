(function () {
  const player = this.selectNextActivePlayer();

  this.find('Deck[domino]').moveRandomItems({
    count: 1,
    target: player.find('Deck[domino]'),
  });

  this.dropPlayedCards();
  this.checkCrutches();

  const newRoundNumber = this.round + 1;
  const newRoundLogEvents = [];
  newRoundLogEvents.push(`<a>Начало раунда №${newRoundNumber}.</a>`);

  const smartMoveRandomCardTarget = this.settings.roundStartCardAddToPlayerHand
    ? player.find('Deck[card]')
    : this.decks.active;
  this.run('smartMoveRandomCard', { target: smartMoveRandomCardTarget });

  // обновляем таймер
  const actionsDisabled = player.eventData.actionsDisabled === true;
  const timerConfig = actionsDisabled ? { time: 5 } : null;
  this.set({ lastRoundTimerConfig: timerConfig }); // нужно для восстановления игры
  player.activate(); // делаем строго после проверки actionsDisabled (внутри activate значение сбросится)

  return { newRoundLogEvents, newRoundNumber };
});
