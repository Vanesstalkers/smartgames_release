(function () {
  let {
    settings: { planesAtStart, skipStartPlanes = [] },
  } = this;

  const gamePlaneDeck = this.find('Deck[plane]');
  const gamesCount = this.game().gamesCount();

  switch (this.gameConfig) {
    case 'competition':

      if (this.isCoreGame()) {
        gamePlaneDeck.find('Plane[8]').moveToTarget(this.decks.table);
      }

      break;

    case 'cooperative':
      let minFreePorts = 0;
      if (this.isCoreGame()) {
        planesAtStart = gamesCount;
        minFreePorts = gamesCount;
      }


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
  }
});
