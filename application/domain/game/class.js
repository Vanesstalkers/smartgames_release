(class Game extends lib.game.class() {
  constructor() {
    super(...arguments);
    Object.assign(this, {
      ...lib.chat['@class'].decorate(),
      ...lib.game.decorators['@hasDeck'].decorate(),
    });

    /* 
    !!!! добавить в release\node_modules\impress\lib\place.js 
      const files = await node.fsp.readdir(targetPath, { withFileTypes: true });

      files.sort((a, b) => {
        if (a.isFile() && !b.isFile()) return -1; // Если 'a' файл, а 'b' нет, то 'a' идет раньше
        if (!a.isFile() && b.isFile()) return 1; // Если 'a' не файл, а 'b' файл, то 'b' идет раньше
        return a.name.localeCompare(b.name);
      });
    */
    const { Bridge, Dice, DiceSide, Plane, Player, Port, Table, Zone, ZoneSide } = domain.game._objects;
    this.defaultClasses({ Bridge, Dice, DiceSide, Plane, Player, Port, Table, Zone, ZoneSide });

    this.preventSaveFields(['availableZones', 'decks']);
    this.preventBroadcastFields(['decks']);
  }
  checkFieldIsReady() {
    const planeList = this.decks.table.getAllItems();
    const bridgeList = this.getObjects({ className: 'Bridge', directParent: this });

    let ready = true;
    for (const releaseItem of [...planeList, ...bridgeList]) {
      if (!ready) continue;
      if (!releaseItem.release) ready = false;
    }

    return ready;
  }
  checkCrutches() {
    let updatedMap = {};
    for (const diceSideId of Object.keys(this.crutchMap || {})) {
      const diceSide = this.get(diceSideId);
      const dice = diceSide.parent();
      const parentZone = dice.findParent({ className: 'Zone' });
      if (!parentZone) {
        updatedMap[diceSideId] = null;
        continue;
      }
      const parentZoneSide = parentZone.sideList.find(({ diceSideCode }) => diceSideCode === diceSide.code);

      let hasCrutch = false;
      if (parentZoneSide?.expectedValues) {
        for (const expectedValue of Object.keys(parentZoneSide.expectedValues)) {
          if (expectedValue.toString() !== diceSide.value.toString()) hasCrutch = true;
        }
      }
      if (hasCrutch === false) updatedMap[diceSideId] = null;
    }
    if (Object.keys(updatedMap).length) this.set({ crutchMap: updatedMap });
  }
  crutchCount() {
    return Object.keys(this.crutchMap || {}).length;
  }
  getFullPrice() {
    const planes = this.decks.table.getAllItems();
    const baseSum = planes.reduce((sum, plane) => sum + plane.price, 0);
    const timerMod = 30 / this.gameTimer;
    const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[this.gameConfig];
    return Math.floor(baseSum * timerMod * configMod);
  }
  addPlayer(data) {
    const { Player } = this.defaultClasses();
    return new Player(data, { parent: this });
  }
});
