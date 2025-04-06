(function () {
  const player = this.roundActivePlayer();

  if (this.status === 'PREPARE_START') {
    if (player) this.toggleEventHandlers('END_ROUND', {}, player);
    return;
  }

  const superGame = this.game();

  // осознанно дублируется логика из roundStart (ради roundReady)
  player.deactivate();
  if (this.checkAllPlayersFinishRound()) {
    this.set({ roundReady: true });
    superGame.broadcastEvent('DICES_DISABLED', { parent: this });
  }

  if (!superGame.allGamesRoundReady()) return;

  for (const game of superGame.getAllGames()) {
    game.run('domain.roundEnd');
  }
  superGame.run('domain.roundEnd');
});
