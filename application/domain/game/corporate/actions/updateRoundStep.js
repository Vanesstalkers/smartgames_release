(function () {
  const player = this.roundActivePlayer();

  if (this.status === 'PREPARE_START') {
    if (player) this.toggleEventHandlers('END_ROUND', {}, player);
    return;
  }

  if (this.round > 0 && player) {
    if (!this.merged) {
      player.checkHandDiceLimit();
    } else {
      const gameCommonDominoDeck = this.find('Deck[domino_common]');

      if (gameCommonDominoDeck.itemsCount() > this.settings.playerHandLimit * this.players().length) {
        // слишком много доминошек в руке
        if (player.eventData.disablePlayerHandLimit) {
          player.set({ eventData: { disablePlayerHandLimit: null } });
        } else {
          gameCommonDominoDeck.moveAllItems({ target: this.find('Deck[domino]') });

          this.logs({
            msg: `У команды превышено максимальное количество костяшек в руке на конец хода. Все костяшки сброшены в колоду.`,
          });
        }
      }
    }
  }

  const superGame = this.game();

  // осознанно дублируется логика из startNewRound (ради roundReady)
  player.deactivate();
  if (this.checkAllPlayersFinishRound()) {
    this.set({ roundReady: true });
    superGame.broadcastEvent('DICES_DISABLED', { parent: this });
  }

  if (!superGame.allGamesRoundReady()) return;

  for (const game of superGame.getAllGames()) {
    game.run('domain.updateRoundStep');
  }
  superGame.run('domain.updateRoundStep');
});
