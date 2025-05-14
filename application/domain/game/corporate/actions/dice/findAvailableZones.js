(function () {
  const parentGame = this.parent().game(); // ксстяшки из одной игры могут лежать в руке игрока из другой
  const parentGameId = parentGame.id();
  const superGame = parentGame.game();

  const result = [];

  // включить, если findAvailableZones будет вызываться откуда то кроме showZonesAvailability
  // parentGame.disableChanges();
  {
    // чтобы не мешать расчету для соседних зон при перемещении из одной зоны в другую (ниже вернем состояние)
    this.getParent().removeItem(this);

    const games = [];
    if (superGame.gameConfig === 'cooperative') {
      const allGamesMerged = superGame.allGamesMerged();
      games.push(...superGame.getAllGames({ roundReady: false }).filter(
        (g) => (allGamesMerged ? true : !g.merged) // с интегрированными в ядро играми можно взаимодействовать только после allGamesMerged
      ));
      if (allGamesMerged) games.push(superGame);
    }
    if (superGame.gameConfig === 'competition') {
      games.push(parentGame.merged ? superGame : parentGame);
    }

    let zoneList = [];
    for (const game of games) {
      const deletedDices = game.getDeletedDices();
      if (deletedDices.length) {
        const deletedDicesZones = deletedDices.reduce((result, dice) => {
          const zone = dice.getParent();
          result.push(zone);
          if (zone.findParent({ className: 'Bridge' })) result.push(...zone.getNearZones());
          return result;
        }, []);

        zoneList.push(...deletedDicesZones);
      } else {
        let planes = game.decks.table.getAllItems();
        let bridges = game.select({ className: 'Bridge', directParent: game });

        if (superGame.gameConfig === 'competition' && parentGame.merged) {
          const mergedPlanes = planes.filter(p => p.anchorGameId === parentGameId);
          const mergedBridges = bridges.filter(b => b.anchorGameId === parentGameId);

          let centralPlanes = [], centralBridges = [];
          const canFillCentral = [...mergedPlanes, ...mergedBridges].find(p => p.hasEmptyZones()) === undefined;
          if (canFillCentral) {
            centralPlanes = planes.filter(p => p.mergedGameId === parentGameId || p.customClass.includes('central'));
            centralBridges = bridges.filter(b => b.mergedGameId === parentGameId);
          }

          planes = [...mergedPlanes, ...centralPlanes];
          bridges = [...mergedBridges, ...centralBridges];
        }
        zoneList.push(
          ...planes.reduce((arr, plane) => {
            const freeZones = plane.select('Zone').filter((zone) => !zone.getItem());
            return arr.concat(freeZones);
          }, [])
        );
        zoneList.push(
          ...bridges.reduce((arr, bridge) => {
            const freeZones = bridge.select('Zone').filter((zone) => !zone.getItem());
            return arr.concat(freeZones);
          }, [])
        );
      }
    }

    for (const zone of zoneList) {
      const { status } = zone.checkIsAvailable(this);
      result.push({ zone, status });
    }

    // восстанавливаем состояние для ранее удаленного dice (ссылка на parent все еще на месте, т.к. она меняется только через updateParent/setParent)
    this.getParent().addItem(this);
  }
  // parentGame.enableChanges();
  return result;
});
