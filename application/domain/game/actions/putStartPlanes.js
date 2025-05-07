(function () {

  const {
    settings: { planesAtStart, skipStartPlanes = [] },
  } = this;

  const gamePlaneDeck = this.find('Deck[plane]');
  const skipArray = skipStartPlanes.map((code) => gamePlaneDeck.find(code));
  for (let i = 0; i < planesAtStart; i++) {
    let plane = gamePlaneDeck.getRandomItem({ skipArray });
    if (plane) {
      skipArray.push(plane.id());
      if (i === 0) {
        // игровое поле пустое
        plane.moveToTarget(this.decks.table);
      } else {
        const availablePorts = this.run('showPlanePortsAvailability', { joinPlaneId: plane.id() });
        if (availablePorts.length === 0) {
          this.run('putPlaneOnFieldRecursive', { planes: [plane] });
        } else {
          const availablePortConfig = availablePorts[Math.floor(Math.random() * availablePorts.length)];
          this.run('putPlaneOnField', availablePortConfig);
        }
      }
    } else {
      i = planesAtStart;
    }
  }
});
