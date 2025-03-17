(function ({ bridge }) {
  const game = this.isSuperGame ? this : this.merged ? this.game() : this;
  game.run('domain.removeBridge', { bridge }); // все bridge хранятся в super-игре
});
