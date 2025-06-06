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

    // должно вызываться после roundStart всех игр, чтобы везде отработали методы добавления костяшек в руку
    for (const game of games) game.playRoundStartCards({ enabled: true });

    this.dumpState();
    return;
  }


  const allGamesMerged = this.allGamesMerged();
  const roundActiveGame = allGamesMerged ? this.selectNextActiveGame() : null;

  const games = this.getAllGames();

  const roundStartGames = [];
  for (const game of games) {
    if (
      (allGamesMerged && roundActiveGame && game !== roundActiveGame)
      || game.disabled // как минимум необходимо сохранить в БД {disabled: true} - без этого сломается восстановление игры
    ) {
      game.set({ round: newRoundNumber }); // иначе иначе будет рассинхрон раундов, которые обновляются в domain.roundStart
      game.dumpState();
      continue;
    }
    game.set({ roundReady: false }); // активируем действия пользователя на фронте (вызываем до roundStart, чтобы попало в dumpState)
    game.run('domain.roundStart'); // внутри дефолтный playRoundStartCards вызовется без { enabled: true }, поэтому не отработает
    roundStartGames.push(game);
  }

  this.dumpState();

  if (allGamesMerged) {
    this.playRoundStartCards(); // у superGame нет кастомного метода playRoundStartCards, так что можно не укаызвать { enabled: true }
  } else {
    // должно вызываться после roundStart всех игр, чтобы везде отработали методы добавления костяшек в руку
    for (const game of roundStartGames) game.playRoundStartCards({ enabled: true });
  }
});
