(function () {
  let {
    settings: { planesAtStart, skipStartPlanes = [] },
  } = this;

  const gamePlaneDeck = this.find('Deck[plane]');
  const gamesCount = this.game().gamesCount();

  switch (this.gameConfig) {
    case 'competition':

      if (this.isCoreGame()) {
        const centralPlane = gamePlaneDeck.find('Plane[8]');
        centralPlane.addCustomClass('central');
        centralPlane.moveToTarget(this.decks.table);

        this.run('putPlaneOnField', {
          targetPortId: centralPlane.find('Port[1]').id(), targetPortDirect: 'top',
          joinPortId: gamePlaneDeck.find('Plane[10]Port[4]').id(), joinPortDirect: 'bottom',
        });
        this.run('putPlaneOnField', {
          targetPortId: centralPlane.find('Port[2]').id(), targetPortDirect: 'top',
          joinPortId: gamePlaneDeck.find('Plane[5]Port[3]').id(), joinPortDirect: 'bottom',
        });
        this.run('putPlaneOnField', {
          targetPortId: centralPlane.find('Port[3]').id(), targetPortDirect: 'bottom',
          joinPortId: gamePlaneDeck.find('Plane[4]Port[2]').id(), joinPortDirect: 'top',
        });
        this.run('putPlaneOnField', {
          targetPortId: centralPlane.find('Port[4]').id(), targetPortDirect: 'bottom',
          joinPortId: gamePlaneDeck.find('Plane[11]Port[1]').id(), joinPortDirect: 'top',
        });
      }

      break;

    case 'cooperative':
      let minFreePorts = 0;
      if (this.isCoreGame()) {
        planesAtStart = gamesCount;
        minFreePorts = gamesCount;
      }


      const skipArray = this.isCoreGame() ? skipStartPlanes.map((code) => gamePlaneDeck.find(code)?.id()) : [];
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
