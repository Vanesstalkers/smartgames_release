({
  decorate: () => ({
    planeMap: {},
    /**
     * @returns {(import('application/domain/game/types.js').objects.Plane)}
     */
    addPlane(data) {
      const plane = new domain.game.objects.Plane(data, { parent: this });
      const planeId = plane.id();

      this.set({ planeMap: { [planeId]: {} } });
      
      this.toggleEventHandlers('ADD_PLANE', { targetId: planeId });
      return plane;
    },
    removePlane(plane) {
      // !!! проверить, что не нужно удалять детей (zone и port)
      this.set({ planeMap: { [plane._id]: null } });
      plane.deleteFromParentsObjectStorage();
    },
  }),
});
