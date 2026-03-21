(function () {
  let gameAward = 0;

  for (const game of [this, ...this.getAllGames()]) {
    const planes = game.decks.table.items();
    const baseSum = planes.reduce((sum, plane) => sum + plane.price, 0);
    const timerMod = 30 / game.gameTimer;
    const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[game.gameConfig] || 1;
    gameAward += Math.floor(baseSum * timerMod * configMod);
  }

  return gameAward;
});
