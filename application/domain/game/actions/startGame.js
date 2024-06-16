(function () {
  const { restorationMode } = this;
  const players = this.players();

  if (!restorationMode) {
    const deck = this.find('Deck[domino]');
    for (const player of players) {
      const playerHand = player.find('Deck[domino]');
      deck.moveRandomItems({ count: this.settings.playerHandStart, target: playerHand });
    }
  }

  this.run('initGameProcessEvents');
  this.set({ status: 'IN_PROCESS' });

  if (restorationMode) {
    lib.timers.timerRestart(this);
    const round = this.round;
    this.set({ round, statusLabel: `Раунд ${round}` });
  } else {
    this.run('endRound', { forceActivePlayer: players[0] });
  }
});
