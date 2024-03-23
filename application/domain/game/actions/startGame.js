(function () {
  const deck = this.find('Deck[domino]');
  const players = this.players();
  for (const player of players) {
    const playerHand = player.find('Deck[domino]');
    deck.moveRandomItems({ count: this.settings.playerHandStart, target: playerHand });
  }

  this.run('initGameProcessEvents');

  this.set({ status: 'IN_PROCESS' });
  this.run('endRound', { forceActivePlayer: players[0] });

  return { status: 'ok' };
});
