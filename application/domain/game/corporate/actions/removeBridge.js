(function ({ bridge }) {
  const game = this.isSuperGame ? this : this.game();
  game.run('domain.removeBridge', { bridge }); // все bridge хранятся в super-игре
});
