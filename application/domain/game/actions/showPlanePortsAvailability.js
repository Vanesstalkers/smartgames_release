(function ({ joinPlaneId }) {
  const availablePorts = [];
  const joinPlane = this.get(joinPlaneId);

  this.disableChanges();
  {
    const joinPorts = joinPlane.select('Port');
    for (const port of joinPorts) {
      const realDirect = port.getDirect();
      for (const direct of Object.keys(port.direct)) {
        port.updateDirect(direct);
        const ports = this.run('getAvailablePortsToJoinPort', { joinPort: port });
        availablePorts.push(...ports);
      }
      port.updateDirect(realDirect);
    }
  }
  this.enableChanges();

  // заменить на clientCustomUpdates не получится, в частности, из-за сложной логики с card-plane (например, при авторозыгрыше "req_*"-карты в начале игры)
  this.set({ availablePorts });

  if (availablePorts.length === 0) {
    this.toggleEventHandlers('NO_AVAILABLE_PORTS', { joinPlane });
  }
});
