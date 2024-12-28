(class Plane extends domain.game._objects.Plane {
  constructor(data = {}) {
    super(...arguments);
    let { sourceGameId } = data;
    if (!sourceGameId) sourceGameId = this.game().id();
    this.set({ sourceGameId });
    this.broadcastableFields(['sourceGameId']);
  }
  getLinkedBridges() {
    let game = this.game();
    if (game.hasSuperGame) game = game.game();
    const ports = this.ports().filter(({ linkedBridgeCode }) => linkedBridgeCode);
    const bridges = ports.map(({ linkedBridgeCode }) => game.find(linkedBridgeCode));
    return bridges;
  }
});
