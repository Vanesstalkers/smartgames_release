(function () {
  const initPlayer = this.roundActivePlayer();

  if (this.status === 'PREPARE_START') {
    if (initPlayer) this.toggleEventHandlers('END_ROUND', {}, initPlayer);
    return;
  }

  // осознанно дублируется логика из startNewRound (ради roundReady)
  initPlayer.deactivate();
  if (this.checkAllPlayersFinishRound()) this.set({ roundReady: true });

  const corporateGame = this.game();
  if (!corporateGame.allGamesRoundReady()) return;

  for (const game of corporateGame.getAllGames()) {
    game.run('domain.updateRoundStep');
  }
  corporateGame.run('domain.updateRoundStep');
});
