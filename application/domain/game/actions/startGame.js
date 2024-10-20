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

  if (restorationMode) {
    const round = this.round;
    this.set({ round, statusLabel: `Раунд ${round}` });
    lib.timers.timerRestart(this);
  } else {
    this.run('handleRound', { notUserCall: true });
  }
});
