(function () {
  // для childGame разыгрываем обычный обработчик
  if (this.hasSuperGame) {
    const roundStepsResult = domain.game.actions.roundSteps.call(this);

    if (this.merged) {
      const player = this.roundActivePlayer();
      const gameCommonDominoDeck = this.find('Deck[domino_common]');
      const gameCommonCardDeck = this.find('Deck[card_common]');
      
      {
        if (gameCommonDominoDeck.itemsCount() > this.settings.playerHandLimit * this.players().length) {
          // слишком много доминошек в руке
          if (!player.eventData.disablePlayerHandLimit) {
            const gameDominoDeck = this.find('Deck[domino]');
            gameCommonDominoDeck.moveAllItems({ target: gameDominoDeck });
            
            this.logs({
              msg: `У команды превышено максимальное количество костяшек в руке на конец хода. Все костяшки сброшены в колоду.`,
            });
          }
        }
        player.set({ eventData: { disablePlayerHandLimit: null } });
        
        player.find('Deck[domino]').moveAllItems({ target: gameCommonDominoDeck, markNew: true });
        player.find('Deck[card]').moveAllItems({ target: gameCommonCardDeck, markNew: true });
      }
    }

    return roundStepsResult;
  }

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
