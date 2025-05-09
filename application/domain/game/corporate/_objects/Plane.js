(class Plane extends domain.game._objects.Plane {
  constructor(data = {}) {
    super(...arguments);
    let { sourceGameId, anchorGameId, mergedPlaneId } = data;
    if (!sourceGameId) sourceGameId = this.game().id();

    this.set({ sourceGameId, anchorGameId, mergedPlaneId });
    this.broadcastableFields(['sourceGameId', 'anchorGameId', 'release']);
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
    const game = this.game();
    const superGame = game.game();

    const ports = this.ports().filter((port) => port.linkedBridgeCode);
    const bridges = ports.map((port) => superGame.find(port.linkedBridgeCode)).filter((bridge) => bridge);

    return bridges;
  }
  canBeRemovedFromTable({ player }) {
    const linkedPlanes = this.getLinkedPlanes();
    const canRemove = linkedPlanes.length - linkedPlanes.filter(p => p.cardPlane).length < 2;
    const anchorGame = this.anchorGameId === player.gameId ? true : false;
    return canRemove && anchorGame;
  }
});
