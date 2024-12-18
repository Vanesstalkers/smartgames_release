(class Dice extends domain.game._objects.Dice {
  constructor() {
    super(...arguments);
    this.broadcastableFields(['teamCode']);
    this.set({ teamCode: this.game().teamCode });
    // !!!! team при восстановлении игры
  }
  findAvailableZones() {
    const game = this.game();
    const superGame = game.game();
    const result = [];

    // включить, если findAvailableZones будет вызываться откуда то кроме showZonesAvailability
    // game.disableChanges();
    {
      // чтобы не мешать расчету для соседних зон при перемещении из одной зоны в другую (ниже вернем состояние)
      this.getParent().removeItem(this);

      const games = superGame.getAllGames({ roundReady: false });
      if (superGame.allGamesMerged()) games.push(superGame);

      const zoneList = [];
      for (const game of games) {
        zoneList.push(
          ...game.decks.table.getAllItems().reduce((arr, plane) => {
            return arr.concat(plane.select('Zone'));
          }, [])
        );

        zoneList.push(
          ...game.getObjects({ className: 'Bridge', directParent: game }).reduce((arr, bridge) => {
            return arr.concat(bridge.select('Zone'));
          }, [])
        );
      }

      for (const zone of zoneList) {
        const status = zone.checkIsAvailable(this);
        result.push({ zone, status });
      }

      // восстанавливаем состояние для ранее удаленного dice (ссылка на parent все еще на месте, т.к. она меняется только через updateParent/setParent)
      this.getParent().addItem(this);
    }
    // game.enableChanges();
    return result;
  }
});
