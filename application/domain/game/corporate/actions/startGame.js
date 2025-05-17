(function () {
  const corporateGame = this.game();

  this.set({ roundReady: true });
  if (!corporateGame.allGamesRoundReady()) return;

  for (const childGame of corporateGame.getAllGames()) {
    childGame.run('domain.startGame');

    if (childGame.gameConfig === 'cooperative' && childGame.players().length === 0) { // игроки могли быть удалены из игры
      childGame.run('initGameFieldsMerge');
      childGame.run('roundEnd');
    }
  }
  corporateGame.run('lib.startGame'); // в domain.startGame специфичные release-обработчики (в частности, наполнение руки)
});
