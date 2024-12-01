(function () {
  const result = [];
  const zones = this.select('Zone');
  zones.push(...this.game().select('Zone')); // core game
  for (const zone of zones) {
    result.push(...zone.select('Dice').filter((dice) => dice.deleted));
  }
  return result;
});
