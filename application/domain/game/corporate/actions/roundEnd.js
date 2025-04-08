(function ({ timerOverdue = false } = {}) {
  const player = this.roundActivePlayer();

  if (this.status === 'PREPARE_START') {
    if (player) this.toggleEventHandlers('END_ROUND', {}, player);
    return;
  }

  this.updateTimerOverdueCounter(timerOverdue);

  const superGame = this.game();

  // осознанно дублируется логика из roundStart (ради roundReady)
  player.deactivate();
  if (this.checkAllPlayersFinishRound()) {
    this.set({ roundReady: true });
    superGame.broadcastEvent('DICES_DISABLED', { parent: this });
  }

  if (!superGame.allGamesRoundReady()) return;

  for (const game of superGame.getAllGames()) {
    const activePlayer = game.roundActivePlayer();
    if (activePlayer) game.toggleEventHandlers('END_ROUND', {}, activePlayer);
  }
  const activePlayer = superGame.roundActivePlayer();
  superGame.toggleEventHandlers('END_ROUND', {}, activePlayer); // когда все игры смерджены, то события карт навешиваются на супер-игру

  const allGamesMerged = superGame.allGamesMerged();
  const roundActiveGame = superGame.roundActiveGame();
  for (const game of superGame.getAllGames()) {
    if (
      allGamesMerged
      && roundActiveGame // будет null, если только что смерджили последнюю игру
      && game !== roundActiveGame // могут добавить костяшку в руку в ход другой игры
    ) continue;

    const activePlayer = game.roundActivePlayer();
    if (game.round > 0 && activePlayer) {
      activePlayer.checkHandDiceLimit(); // отдельный цикл ради этой проверки (в конце хода может добавиться карта в руку)
    }

    game.run('roundStart'); // просто обойти массив checkPlayers нельзя, т.к. в команде может быть только один игрок
  }

  superGame.run('roundStart');
});
