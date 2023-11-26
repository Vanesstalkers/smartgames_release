(function () {
  this.initEvent(
    {
      handlers: {
        START_GAME: function () {
          const { game, player } = this.eventContext();
          
          const players = game.players();
          
          const deck = this.find('Deck[domino]');
          for (const player of players) {
            const playerHand = player.find('Deck[domino]');
            deck.moveRandomItems({ count: this.settings.playerHandStart, target: playerHand });
          }
          
          game.set({ status: 'IN_PROCESS' });
          this.run('endRound', { forceActivePlayer: players[0] });
        },

        
      },
    },
    {
      defaultResetHandler: true,
      player: this.getActivePlayer(),
    }
  );

  return { status: 'ok' };
});
