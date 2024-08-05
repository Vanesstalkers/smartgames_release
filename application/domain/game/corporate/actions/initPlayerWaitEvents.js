(function () {
  this.initEvent(
    {
      init: function () {
        const { game, player } = this.eventContext();
        game.set({ statusLabel: 'Ожидание игроков', status: 'WAIT_FOR_PLAYERS' });
      },
      handlers: {
        PLAYER_JOIN: function () {
          const { game, player } = this.eventContext();

          if (game.getFreePlayerSlot()) return { preventListenerRemove: true };

          if (game.restorationMode) {
            if (game.isCoreGame()) {
              for (const childGame of Object.values(game.store.game)) {
                childGame.run('startGame');
              }
              game.run('initGameProcessEvents');
              game.set({ status: 'IN_PROCESS' });
            }
            this.emit('RESET');
            return;
          }

          game.run('putStartPlanes');
          this.emit('RESET');

          if (game.isCoreGame()) {
            for (const plane of game.decks.table.items()) {
              plane.set({ customClass: (plane.customClass || []).concat(['core']) });
            }

            for (const childGame of Object.values(game.store.game)) {
              childGame.run('startGame');
            }
            game.run('initGameProcessEvents');
            game.set({ status: 'IN_PROCESS' });
          }
        },
      },
    },
    { defaultResetHandler: true, allowedPlayers: this.players() }
  );
});
