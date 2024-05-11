(function ({ bridge }) {
  const linkedPorts = bridge.getLinkedPorts();
  const bridgeZone = this.get(Object.keys(bridge.zoneMap)[0]);
  const bridgeDice = this.get(Object.keys(bridgeZone.itemMap)[0]);

  this.set({ bridgeMap: { [bridge.id()]: null } });
  if (bridgeDice) bridgeDice.moveToTarget(this.find('Deck[domino]'));

  for (const port of linkedPorts) {
    port.set({ linkedBridge: null });
  }

  for (const side of bridge.select('ZoneSide')) {
    for (const linkSideId of Object.keys(side.links)) {
      const linkSide = this.get(linkSideId);
      const linkZone = linkSide.parent();
      linkSide.deleteLink(side);
      linkZone.updateValues();
    }
  }

  bridgeZone.deleteFromParentsObjectStorage();
  bridgeZone.markDelete({ saveToDB: true });

  bridge.deleteFromParentsObjectStorage();
  bridge.markDelete({ saveToDB: true });
});
