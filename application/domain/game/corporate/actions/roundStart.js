(function ({ initPlayer } = {}) {
  if (!this.isCoreGame()) return; // без этой проверки не обойтись, из-за выхова в startGame

  const newRoundNumber = this.round + 1;
  this.set({ statusLabel: `Раунд ${newRoundNumber}`, round: newRoundNumber });

  if (this.gameRoundLimit && newRoundNumber > this.gameRoundLimit)
    return this.run('endGame', { msg: { lose: `Игра закончена. Превышен лимит раундов (${this.gameRoundLimit}).` } });

  if (this.gameConfig === 'competition') {
    const games = this.roundPool.next({ fixState: true });

    for (const game of games) {
      game.set({ roundReady: false }); // активируем действия пользователя на фронте (вызываем до roundStart, чтобы попало в dumpState)
      game.run('domain.roundStart');
    }

    for (const game of this.getAllGames().filter(g => !games.includes(g))) {
      game.set({ round: newRoundNumber }); // иначе иначе будет рассинхрон раундов, которые обновляются в domain.roundStart
      game.dumpState();
    }

    this.dumpState();
    return;
  }


  const allGamesMerged = this.allGamesMerged();
  const roundActiveGame = allGamesMerged ? this.selectNextActiveGame() : null;

  const games = this.getAllGames();

  for (const game of games) {
    const activePlayers = game.players().filter(p => p.ready); // могли выйти из игры
    if (activePlayers.length === 0) continue;

    if (allGamesMerged && roundActiveGame && game !== roundActiveGame) {
      game.set({ round: newRoundNumber }); // иначе иначе будет рассинхрон раундов, которые обновляются в domain.roundStart
      game.dumpState();
      continue;
    }
    game.set({ roundReady: false }); // активируем действия пользователя на фронте (вызываем до roundStart, чтобы попало в dumpState)
    game.run('domain.roundStart');
  }

  this.dumpState();
  if (allGamesMerged) this.playRoundStartCards();
});
