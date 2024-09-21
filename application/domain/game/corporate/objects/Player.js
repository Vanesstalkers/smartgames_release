(class Player extends domain.game['@objects'].Player {
  constructor() {
    super(...arguments);
    this.broadcastableFields(['teamlead']);
  }
});
