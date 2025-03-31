(function (data) {
  const store = this.getStore();
  const { Bridge, Zone } = this.defaultClasses();
  const bridge = new Bridge(data, { parent: this });
  this.set({ bridgeMap: { [bridge._id]: {} } });

  if (data.zoneMap) {
    data.zoneList = [];
    for (const _id of Object.keys(data.zoneMap)) data.zoneList.push(store.zone[_id]);
  }
  for (const item of data.zoneList || []) {
    const zone = new Zone(item, { parent: bridge });
    bridge.set({ zoneMap: { [zone._id]: {} } });
  }

  if (data.zoneLinks) {
    for (const [zoneCode, sideList] of Object.entries(data.zoneLinks)) {
      for (const [sideCode, links] of Object.entries(sideList)) {
        for (const linkSideId of links) {
          const zone = bridge.find(zoneCode);
          const side = zone.find(sideCode);
          const linkSide = bridge.game().get(linkSideId);
          const linkZone = linkSide.parent();
          side.addLink(linkSide);
          linkSide.addLink(side);
          linkZone.updateValues();
        }
      }
    }
  }

  return bridge;
});
