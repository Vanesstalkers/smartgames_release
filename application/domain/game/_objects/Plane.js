(class Plane extends lib.game.GameObject {
  zoneMap = {};
  portMap = {};

  constructor(data, { parent }) {
    super(data, { col: 'plane', parent });
    this.broadcastableFields([
      ...['_id', 'code', 'zoneMap', 'portMap', 'customClass'],
      ...['price', 'width', 'height', 'left', 'top', 'rotation', 'eventData'],
    ]);

    const { price, width, height, left = 0, top = 0, rotation = 0 } = data;
    const { release = false, customClass = [], cardPlane = false } = data;
    this.set({ price, width, height, left, top, rotation, release, customClass, cardPlane });

    if (data.zoneMap) {
      data.zoneList = [];
      for (const _id of Object.keys(data.zoneMap)) data.zoneList.push(this.getStore().zone[_id]);
    }

    const Zone = this.game().defaultClasses()['Zone'];
    for (const item of data.zoneList || []) {
      const zone = new Zone(item, { parent: this });
      this.set({ zoneMap: { [zone._id]: {} } });
    }
    if (data.zoneLinks) {
      for (const [zoneCode, sideList] of Object.entries(data.zoneLinks)) {
        for (const [sideCode, links] of Object.entries(sideList)) {
          for (const link of links) {
            const [linkZoneCode, linkSideCode] = link.split('.');
            const zone = this.find(zoneCode);
            const side = zone.find(sideCode);
            const linkZone = this.find(linkZoneCode);
            const linkSide = linkZone.find(linkSideCode);
            side.addLink(linkSide);
            linkSide.addLink(side);
          }
        }
      }
    }

    if (data.portMap) {
      data.portList = [];
      for (const _id of Object.keys(data.portMap)) data.portList.push(this.getStore().port[_id]);
    }
    for (const port of data.portList || []) {
      const filledLinks = {};
      for (const linkCode of Object.values(port.links)) {
        const [linkZoneCode, linkSideCode] = linkCode.split('.');
        const linkZone = this.find(linkZoneCode);
        const linkSide = linkZone.find(linkSideCode);
        filledLinks[linkSide._id] = linkCode;
      }
      this.addPort({ ...port, links: filledLinks });
    }
  }

  addCustomClass(newClassArray) {
    if (!Array.isArray(newClassArray)) newClassArray = [newClassArray];
    this.set({ customClass: (this.customClass || []).concat(newClassArray) });
  }
  removeCustomClass(classArray) {
    if (!Array.isArray(classArray)) classArray = [classArray];
    this.set({ customClass: (this.customClass || []).filter((item) => !classArray.includes(item)) });
  }

  isCardPlane() {
    return this.cardPlane;
  }

  addPort(data) {
    const portClass = this.game().defaultClasses()['Port'];
    const port = new portClass(data, { parent: this });
    this.set({ portMap: { [port._id]: {} } });
  }
  ports() {
    return this.select('Port');
  }
  updatePorts(updateData) {
    for (const port of this.ports()) port.set(updateData);
  }
  getZone() {
    return Object.keys(this.zoneMap)
      .map((_id) => this.getStore().zone[_id])
      .find((zone) => zone.code === code);
  }

  getCurrentRotation() {
    return this.rotation;
  }
  getPosition() {
    const rotation = this.getCurrentRotation();
    switch (rotation) {
      case 0:
        return {
          left: this.left,
          right: this.left + this.width,
          top: this.top,
          bottom: this.top + this.height,
          rotation,
        };
      case 1:
        return {
          left: this.left - this.height,
          right: this.left,
          top: this.top,
          bottom: this.top + this.width,
          rotation,
        };
      case 2:
        return {
          left: this.left - this.width,
          right: this.left,
          top: this.top - this.height,
          bottom: this.top,
          rotation,
        };
      case 3:
        return {
          left: this.left,
          right: this.left + this.height,
          top: this.top - this.width,
          bottom: this.top,
          rotation,
        };
    }
  }
  moveToTarget(target) {
    const currentParent = this.getParent();
    currentParent.removeItem(this); // сначала удаляем
    const moveResult = target.addItem(this);
    if (moveResult) {
      this.updateParent(target);
      if (target.afterAddItem) target.afterAddItem(this);
    } else {
      currentParent.addItem(this); // восстанавливаем, если не получилось переместить
    }
    return moveResult;
  }
  removeFromTableToHand({ player }) {
    const game = this.game();
    const deck = player.find('Deck[plane]');

    const eventData = { plane: {} };
    eventData.plane[this.id()] = { selectable: null };

    const linkedBridges = this.getLinkedBridges();
    for (const bridge of linkedBridges) {
      game.run('removeBridge', { bridge });

      if (!this.cardPlane && bridge.bridgeToCardPlane) {
        const cardPlaneId = bridge.linkedPlanesIds.find((id) => id !== this.id());
        const cardPlane = game.get(cardPlaneId);
        cardPlane.moveToTarget(deck);
        cardPlane.set({ left: 0, top: 0 });
        eventData.plane[cardPlane.id()] = { selectable: null };
      }
    }
    player.set({ eventData });

    this.moveToTarget(deck);
    this.set({ left: 0, top: 0 });
  }
  getLinkedBridges() {
    const game = this.game();
    const ports = this.ports().filter((port) => port.linkedBridgeCode);
    const bridges = ports.map((port) => game.find(port.linkedBridgeCode)).filter((bridge) => bridge);
    return bridges;
  }
  getLinkedPlanes() {
    const game = this.game();
    const bridges = this.getLinkedBridges();
    const planesIds = bridges.map((bridge) => bridge.linkedPlanesIds.find((id) => id !== this.id()));
    const planes = planesIds.map((id) => game.get(id));
    return planes;
  }
  hasEmptyZones() {
    return this.select('Zone').find((zone) => !zone.getItem()) ? true : false;
  }
});
