(function () {
  const players = this.players();

  if (!this.restorationMode) {
    const deck = this.find('Deck[domino]');
    for (const player of players) {
      const playerHand = player.find('Deck[domino]');
      deck.moveRandomItems({ count: this.settings.playerHandStart, target: playerHand });
    }
  }
  // PIPELINE_GAME_START (6.3) :: готовим стартовые руки и вызываем lib.startGame
  this.run('lib.startGame');
});
