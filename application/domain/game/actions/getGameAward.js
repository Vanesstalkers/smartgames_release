(function () {
  const planes = this.decks.table.items();
  const baseSum = planes.reduce((sum, plane) => sum + plane.price, 0);
  const timerMod = 30 / this.gameTimer;
  const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[this.gameConfig];
  return Math.floor(baseSum * timerMod * configMod);
});
