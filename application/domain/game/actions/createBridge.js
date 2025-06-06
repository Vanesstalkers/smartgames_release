(function ({ joinPort, targetPort }) {
  const joinPlane = joinPort.getParent();
  const targetPlane = targetPort.getParent();
  const bridgeToCardPlane = joinPlane.isCardPlane();
  // ! zoneLinks может быть несколько (links[...]) - пока что не актуально (нет таких Plane)
  const targetPortLinks = Object.keys(targetPort.links);
  const joinPortLinks = Object.keys(joinPort.links);
  const { DIRECTIONS } = joinPort.constructor;
  const targetPortDirect = DIRECTIONS[targetPort.getDirect()];
  const { reverse: reverseLinks, vertical: verticalZone } = targetPortDirect.bridge;

  const bridgeZoneLinks = {};
  const zs = [null, 'ZoneSide[1]', 'ZoneSide[2]'];
  if (bridgeToCardPlane) {
    bridgeZoneLinks[reverseLinks ? zs[2] : zs[1]] = targetPortLinks;
    // у card-plane отсутствует связанная zone
  } else {
    bridgeZoneLinks[reverseLinks ? zs[2] : zs[1]] = targetPortLinks;
    bridgeZoneLinks[reverseLinks ? zs[1] : zs[2]] = joinPortLinks;
  }

  const { targetLinkPoint } = this.run('updatePlaneCoordinates', { joinPort, targetPort });

  const bridgeData = {
    _code: joinPlane.code + '-' + targetPlane.code,
    left: targetLinkPoint.left,
    top: targetLinkPoint.top,
    masterPlaneId: targetPlane.id(),
    zoneLinks: { 'Zone[1]': bridgeZoneLinks },
    zoneList: [
      {
        _code: 1,
        left: 0,
        top: 0,
        itemType: 'any',
        vertical: verticalZone,
      },
    ],
    linkedPlanesIds: [joinPlane.id(), targetPlane.id()],
    linkedPortsIds: [joinPort.id(), targetPort.id()],
    bridgeToCardPlane,
  };

  const bridge = this.run('addBridge', bridgeData);
  bridge.set({ anchorGameId: targetPlane.anchorGameId });

  const linkedBridgeCode = bridge.code;
  joinPort.set({ linkedBridgeCode });
  targetPort.set({ linkedBridgeCode });

  return bridge;
});
