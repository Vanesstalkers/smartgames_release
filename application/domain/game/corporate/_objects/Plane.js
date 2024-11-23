(class Plane extends domain.game._objects.Plane {
  constructor() {
    super(...arguments);
    this.set({ sourceGameId: this.game().id() });
    this.broadcastableFields(['sourceGameId']);
  }
});
