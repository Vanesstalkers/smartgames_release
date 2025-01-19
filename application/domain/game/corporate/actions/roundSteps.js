(function () {
  if (this.isSuperGame) return;

  if (this.merged) {
    const player = this.roundActivePlayer();
    const gameCommonDominoDeck = this.find('Deck[domino_common]');
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
    }
  }

  const roundStepsResult = domain.game.actions.roundSteps.call(this);
  return roundStepsResult;
});
