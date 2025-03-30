(class Zone extends domain.game._objects.Zone {
  constructor(data = {}) {
    super(...arguments);
    let { sourceGameId } = data;
    if (!sourceGameId) sourceGameId = this.game().id();
    this.set({ sourceGameId });
    this.broadcastableFields(['sourceGameId']);
  }
  // getNearZones() {
  //   let game = this.game();
  //   if (game.hasSuperGame) game = game.game();
  //   const zones = [];
  //   for (const side of this.getSides()) {
  //     for (const linkCode of Object.values(side.links)) {
  //       zones.push(game.find(linkCode).getParent());
  //     }
  //   }
  //   return zones;
  // }
});
