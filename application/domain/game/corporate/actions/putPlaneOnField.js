(function ({ joinPortId, targetPortId, targetPortDirect, joinPortDirect }) {
  const joinPort = this.get(joinPortId);
  const joinPlane = joinPort.getParent();
  const targetPort = this.get(targetPortId);
  const joinGame = joinPort.game();
  const targetGame = targetPort.game();

  const { bridge } = this.run('domain.putPlaneOnField', ...arguments);

  if (joinGame !== targetGame) {
    joinPlane.set({ mergedPlane: true });
    bridge.set({ mergedGameId: joinGame.id() });
  }
});
