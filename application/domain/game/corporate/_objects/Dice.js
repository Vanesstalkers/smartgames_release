(class Dice extends domain.game._objects.Dice {
  constructor(data = {}) {
    super(...arguments);
    let { sourceGameId } = data;
    if (!sourceGameId) sourceGameId = this.game().id();
    this.set({ sourceGameId });
    this.broadcastableFields(['sourceGameId']);
  }
  sourceGame() {
    return lib.store('game').get(this.sourceGameId);
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

      const games = [];
      if (superGame.gameConfig === 'cooperative') {
        const allGamesMerged = superGame.allGamesMerged();
        games.push(...superGame.getAllGames({ roundReady: false }).filter(
          (g) => (allGamesMerged ? true : !g.merged) // с интегрированными в ядро играми можно взаимодействовать только после allGamesMerged
        ));
        if (allGamesMerged) games.push(superGame);
      }
      if (superGame.gameConfig === 'competition') {
        games.push(game);
        if (game.merged) games.push(superGame);
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
          const planes = game.decks.table.getAllItems();
          zoneList.push(
            ...planes.reduce((arr, plane) => {
              const freeZones = plane.select('Zone').filter((zone) => !zone.getItem());
              return arr.concat(freeZones);
            }, [])
          );

          const bridges = game.getObjects({ className: 'Bridge', directParent: game });
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
    // game.enableChanges();
    return result;
  }
  moveToTarget(target, { markDelete = false } = {}) {
    const sourceGame = this.sourceGame();
    const targetGame = target.game();

    const targetParent = target.parent();
    const targetCode = target.shortCode();

    if (targetParent.is('Game')) {
      if (targetCode === 'Deck[domino]') {
        if (targetGame !== sourceGame) {
          // сброшенные костяшки возвращаем в исходную колоду
          target = sourceGame.find('Deck[domino]');
        }
      }
    }

    if (targetGame.merged) {
      if (targetParent.is('Player')) {
        if (targetCode === 'Deck[domino]') {
          // рука игрока

          target = targetGame.find('Deck[domino_common]');
        }
      }
    }

    return super.moveToTarget(target, { markDelete });
  }
});
