(class Bridge extends lib.game.GameObject {
  zoneMap = {};
  width = 0;
  height = 0;

  constructor(data, { parent }) {
    super(data, { col: 'bridge', parent });
    this.broadcastableFields(['_id', 'code', 'zoneMap', 'width', 'height', 'left', 'top', 'rotation']);

    this.set({
      release: data.release || false,
      left: data.left,
      top: data.top,
      rotation: data.rotation || 0,
      linkedPlanesIds: data.linkedPlanesIds,
      linkedPortsIds: data.linkedPortsIds,
      bridgeToCardPlane: data.bridgeToCardPlane,
    });
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
