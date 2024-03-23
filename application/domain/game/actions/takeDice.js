(function ({ count }) {
  return;
  const player = this.getActivePlayer();
  const playerHand = player.find('Deck[domino]');
  const deck = this.find('Deck[domino]');
  deck.moveRandomItems({ count, target: playerHand });
});
