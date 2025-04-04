(function ({ initPlayer } = {}) {
  if (!this.isCoreGame()) return;

  const newRoundNumber = this.round + 1;
  this.set({ statusLabel: `Раунд ${newRoundNumber}`, round: newRoundNumber });
  const allGamesMerged = this.allGamesMerged();
  const roundActiveGame = allGamesMerged ? this.selectNextActiveGame() : null;

  const games = this.getAllGames();

  // карты должны вернуться в исходные колоды своих игр до того, иначе первая по списку игра не увидит то, что было разыграно из ее колоды в последующих играх
  this.dropPlayedCards();
  for (const game of games) game.dropPlayedCards();

  for (const game of games) {
    if (allGamesMerged && roundActiveGame && game !== roundActiveGame) {
      game.set({ round: newRoundNumber }); // иначе иначе будет рассинхрон раундов, которые обновляются в domain.startNewRound
      game.dumpState();
      continue;
    }
    game.set({ roundReady: false }); // активируем действия пользователя на фронте (вызываем до startNewRound, чтобы попало в dumpState)
    game.run('domain.startNewRound');
  }

  this.dumpState();
  if (allGamesMerged) this.playRoundStartCards();
});
