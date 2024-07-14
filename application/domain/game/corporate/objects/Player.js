(class Player {
  constructor(data, { parent }) {
    const player = new domain.game.objects.Player(data, { parent });
    player.broadcastableFields(['teamlead']);
    return player;
  }
});
