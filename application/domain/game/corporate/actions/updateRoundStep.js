(function () {
  const initPlayer = this.roundActivePlayer();

  if (this.status === 'PREPARE_START') {
    if (initPlayer) this.toggleEventHandlers('END_ROUND', {}, initPlayer);
    return;
  }

  initPlayer.deactivate();
  if (this.checkAllPlayersFinishRound()) this.set({ roundReady: true });

  const corporateGame = this.game();
  if (!corporateGame.allGamesRoundReady()) return;

  for (const game of corporateGame.getAllGames()) {
    // делаем preventStartNewRound, потому что все объекты лежат в store корпоративной игры
    game.run('domain.updateRoundStep', { preventStartNewRound: true });
  }
  // в corporateGame нужна особая логика работы с активным игроком/командой
  corporateGame.run('domain.updateRoundStep', { preventStartNewRound: true });
  for (const game of corporateGame.getAllGames()) {
    game.run('startNewRound');
  }
});
