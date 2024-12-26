(function () {
  const initPlayer = this.roundActivePlayer();

  if (this.status === 'PREPARE_START') {
    if (initPlayer) this.toggleEventHandlers('END_ROUND', {}, initPlayer);
    return;
  }

  // осознанно дублируется логика из startNewRound (ради roundReady)
  initPlayer.deactivate();
  if (this.checkAllPlayersFinishRound()) this.set({ roundReady: true });

  const superGame = this.game();
  if (!superGame.allGamesRoundReady()) return;

  for (const game of superGame.getAllGames()) {
    game.run('domain.updateRoundStep');
  }
  superGame.run('domain.updateRoundStep');
});
