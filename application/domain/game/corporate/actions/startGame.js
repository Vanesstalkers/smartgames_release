(function () {
  const corporateGame = this.game();

  this.set({ roundReady: true });
  if (!corporateGame.allGamesRoundReady()) return;

  for (const childGame of corporateGame.getAllGames()) {
    childGame.run('domain.startGame');
  }
  corporateGame.run('lib.startGame'); // в domain.startGame специфичные release-обработчики (в частности, наполнение руки)
});
