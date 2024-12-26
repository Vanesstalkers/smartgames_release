(function () {
  // для childGame разыгрываем обычный обработчик
  if (!this.isCoreGame()) return domain.game.actions.roundSteps.call(this);

  const { round } = this;

  let roundActiveGame;
  if (this.allGamesMerged()) {
    this.selectNextActiveGame();
  }

  const newRoundNumber = round + 1;
  const newRoundLogEvents = [];
  newRoundLogEvents.push(`Начало раунда №${newRoundNumber}.`);

  return { newRoundLogEvents, newRoundNumber, roundActiveGame };
});
