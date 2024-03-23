(function () {
  const result = [];
  for (const zone of this.select('Zone')) {
    result.push(...zone.select('Dice').filter((dice) => dice.deleted));
  }
  return result;
});
