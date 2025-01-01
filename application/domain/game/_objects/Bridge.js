(class Bridge extends lib.game.GameObject {
  zoneMap = {};
  width = 0;
  height = 0;

  constructor(data, { parent }) {
    super(data, { col: 'bridge', parent });
    this.broadcastableFields(['_id', 'code', 'zoneMap', 'width', 'height', 'left', 'top', 'rotation']);

    let { sourceGameId, release = false, left, top, rotation = 0 } = data;
    const { masterPlaneId, linkedPlanesIds, linkedPortsIds, bridgeToCardPlane } = data;
    if (!sourceGameId) sourceGameId = this.game().id();
    this.set({
      ...{ sourceGameId, release, left, top, rotation },
      ...{ masterPlaneId, linkedPlanesIds, linkedPortsIds, bridgeToCardPlane },
    });
    this.updateRotation();
  }
  updateParent(game) {
    // у bridge не может быть другого parent, кроме game
    if (game) {
      const bridgeId = this.id();
      this.parent().set({ bridgeMap: { [bridgeId]: null } });
      super.updateParent(game);
      this.game(game);
      game.set({ bridgeMap: { [bridgeId]: {} } });
    }
  }
  updateRotation() {
    const masterPlane = this.game().get(this.masterPlaneId);
    if (masterPlane) this.set({ rotation: masterPlane.rotation });
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
