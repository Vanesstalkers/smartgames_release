(class Plane extends domain.game._objects.Plane {
  constructor(data = {}) {
    super(...arguments);
    let { sourceGameId, mergedPlane } = data;
    if (!sourceGameId) sourceGameId = this.game().id();
    this.set({ sourceGameId, mergedPlane });
    this.broadcastableFields(['sourceGameId']);
  }
  game(game) {
    const currentGame = super.game();
    if (!game) return currentGame;
    super.game(game);

    if (game === currentGame) return;

    for (const obj of this.getAllObjects({ directParent: false })) {
      obj.game(game);
    }
  }
  updateParent(newParent) {
    super.updateParent(newParent);

    const newParentGame = newParent.game();
    if (newParentGame !== this.game()) {
      this.game(newParentGame);
    }
  }
  moveToTarget(target) {
    const currentParent = this.parent();
    super.moveToTarget(target);
    const newParentGame = target.game();
    if (newParentGame !== currentParent.game()) {
      this.game(newParentGame);
    }
  }
  getLinkedBridges() {
    const bridges = super.getLinkedBridges();

    if (this.mergedPlane) {
      const game = this.game();
      const superGame = game.game();
      bridges.push(
        // bridge-связка с супер-игрой
        ...superGame.select({ className: 'Bridge', attr: { mergedGameId: game.id() } })
      );
    }

    return bridges;
  }
});
