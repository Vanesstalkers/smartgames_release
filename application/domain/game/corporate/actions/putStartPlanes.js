(function () {
  let {
    settings: { planesAtStart, skipStartPlanes = [] },
  } = this;
  let minFreePorts = 0;

  const gamesCount = this.game().gamesCount();
  if (this.isCoreGame()) {
    planesAtStart = gamesCount;
    minFreePorts = gamesCount;
  }

  const gamePlaneDeck = this.find('Deck[plane]');
  const skipArray = this.isCoreGame() ? skipStartPlanes.map((code) => this.find(code)?.id()) : [];
  for (let i = 0; i < planesAtStart; i++) {
    let plane = gamePlaneDeck.getRandomItem({ skipArray });
    if (plane) {
      skipArray.push(plane.id());
      if (i === 0) {
        // игровое поле пустое
        plane.moveToTarget(this.decks.table);
      } else {
        this.run('putPlaneOnFieldRecursive', { planes: [plane], minFreePorts });
      }
    } else {
      i = planesAtStart;
    }
  }
});
