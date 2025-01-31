(function () {
  // if (this.code) {
  //   // this.find('CorporateGame[1]Deck[plane]Plane[1]').moveToTarget(this.decks.table);

  //   this.find('CorporateGame[1]Deck[plane]Plane[4]').moveToTarget(this.decks.table);

  //   this.run('putPlaneOnField', {
  //     targetPortId: this.find('CorporateGame[1]Deck[plane]Plane[4]Port[1]').id(),
  //     targetPortDirect: 'top',
  //     joinPortId: this.find('CorporateGame[1]Deck[plane]Plane[1]Port[1]').id(),
  //     joinPortDirect: 'left',
  //   });

  //   this.run('putPlaneOnField', {
  //     targetPortId: this.find('CorporateGame[1]Deck[plane]Plane[1]Port[2]').id(),
  //     targetPortDirect: 'right',
  //     joinPortId: this.find('CorporateGame[1]Deck[plane]Plane[9]Port[1]').id(),
  //     joinPortDirect: 'left',
  //   });
  // } else {
  //   this.find('Deck[plane]Plane[16]').moveToTarget(this.decks.table);

  //   this.run('putPlaneOnField', {
  //     targetPortId: this.find('Deck[plane]Plane[16]Port[2]').id(),
  //     targetPortDirect: 'top',
  //     joinPortId: this.find('Deck[plane]Plane[15]Port[1]').id(),
  //     joinPortDirect: 'top',
  //   });
  // }
  // return;

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
