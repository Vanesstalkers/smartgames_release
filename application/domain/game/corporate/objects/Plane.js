(class Plane extends domain.game['@objects'].Plane {
  constructor() {
    super(...arguments);
    this.set({ sourceGameId: this.game().id() });
    this.broadcastableFields(['sourceGameId']);
  }
});
