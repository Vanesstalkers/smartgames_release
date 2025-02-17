(class Plane extends domain.game._objects.Plane {
  constructor(data = {}) {
    super(...arguments);
    let { sourceGameId, anchorGameId, mergedPlane } = data;
    if (!sourceGameId) sourceGameId = this.game().id();
    this.set({ sourceGameId, anchorGameId, mergedPlane });
    this.broadcastableFields(['sourceGameId', 'anchorGameId']);
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
  moveToTarget(target, { anchorGameId } = {}) {
    if (target.subtype === 'table' && !this.anchorGameId) {
      this.set({ anchorGameId: anchorGameId || this.game().id() });
    }

    const currentParent = this.parent();
    super.moveToTarget(target);
    const newParentGame = target.game();
    if (newParentGame !== currentParent.game()) {
      this.game(newParentGame);
    }
  }
  getLinkedBridges() {
    // const bridges = super.getLinkedBridges();
    const game = this.game();
    const superGame = game.game();

    const ports = this.ports().filter((port) => port.linkedBridgeCode);
    const bridges = ports.map((port) => superGame.find(port.linkedBridgeCode)).filter((bridge) => bridge);

    // if (this.mergedPlane) {
    //   const game = this.game();
    //   const superGame = game.game();
    //   bridges.push(
    //     // bridge-связка с супер-игрой
    //     ...superGame.select({ className: 'Bridge', attr: { mergedGameId: game.id() } })
    //   );
    // }

    return bridges;
  }
});
