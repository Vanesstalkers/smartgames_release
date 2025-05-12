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
    return domain.game.corporate.actions.dice.findAvailableZones.call(this);
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
