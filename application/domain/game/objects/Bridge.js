(class Bridge extends lib.game.GameObject {
  zoneMap = {};
  width = 0;
  height = 0;

  constructor(data, { parent }) {
    super(data, { col: 'bridge', parent });
    this.broadcastableFields(['_id', 'code', 'zoneMap', 'width', 'height', 'left', 'top', 'rotation']);

    const { release = false, left, top, rotation = 0, linkedPlanesIds, linkedPortsIds, bridgeToCardPlane } = data;
    this.set({ release, left, top, rotation, linkedPlanesIds, linkedPortsIds, bridgeToCardPlane });
  }

  getLinkedPorts() {
    const game = this.game();
    const ports = this.linkedPortsIds.map((id) => game.get(id));
    return ports;
  }
  getLinkedPlanes() {
    const game = this.game();
    const planes = this.linkedPlanesIds.map((id) => game.get(id));
    return planes;
  }
});
