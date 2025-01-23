(class Dice extends domain.game._objects.Dice {
  constructor(data = {}) {
    super(...arguments);
    let { sourceGameId } = data;
    if (!sourceGameId) sourceGameId = this.game().id();
    this.set({ sourceGameId });
    this.broadcastableFields(['sourceGameId']);
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
      if (superGame.allGamesFieldReady() && superGame.allGamesMerged()) games.push(superGame);

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
  moveToTarget(target) {
    const game = this.game();

    if (game.hasSuperGame && game.merged) {
      if (target.type === 'domino' && !target.subtype && target.parent().matches({ className: 'Player' })) {
        target = game.find('Deck[domino_common]');
      }
    }

    const item = super.moveToTarget(target, {preventDelete: true});
    return item;
  }
});
