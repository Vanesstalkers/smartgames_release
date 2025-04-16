(function () {
  const players = this.players().filter(p => !p.removed);

  if (!this.restorationMode) {
    const deck = this.find('Deck[domino]');
    for (const player of players) {
      const playerHand = player.find('Deck[domino]');
      deck.moveRandomItems({ count: this.settings.playerHandStart, target: playerHand });
    }
  }

  this.run('lib.startGame');
});
