(function () {

  const {
    settings: { planesAtStart, skipStartPlanes = [] },
  } = this;

  const gamePlaneDeck = this.find('Deck[plane]');
  const skipArray = skipStartPlanes.map((code) => this.find(code));
  for (let i = 0; i < planesAtStart; i++) {
    let plane = gamePlaneDeck.getRandomItem({ skipArray });
    if (plane) {
      skipArray.push(plane.id());
      if (i === 0) {
        // игровое поле пустое
        plane.moveToTarget(this.decks.table);
      } else {
        this.run('showPlanePortsAvailability', { joinPlaneId: plane.id() });
        if (this.availablePorts.length === 0) {
          this.run('putPlaneOnFieldRecursive', { planes: [plane] });
        } else {
          const availablePortConfig = this.availablePorts[Math.floor(Math.random() * this.availablePorts.length)];
          this.run('putPlaneOnField', availablePortConfig);
        }
      }
    } else {
      i = planesAtStart;
    }
  }
});
