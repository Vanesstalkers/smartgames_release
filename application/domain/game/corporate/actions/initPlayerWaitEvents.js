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
                childGame.run('domain.startGame');
              }
              game.run('initGameProcessEvents');
              this.set({ status: 'IN_PROCESS' });
            }
            this.emit('RESET');
            return;
          }

          if (game.isCoreGame()) {

            // это все нужно убрать в game.run('initPrepareCoreGameEvents');
            game.settings.planesAtStart = game.settings.planesNeedToStart; // тут некому размещать plane руками
            game.run('putStartPlanes');

            for (const plane of game.decks.table.items()) {
              plane.set({ customClass: (plane.customClass || []).concat(['core']) });
            }

            
            game.initEvent(domain.game.events.common.gameProcess(), {
              defaultResetHandler: true,
              allowedPlayers: game.players(),
            });

            for (const childGame of Object.values(game.store.game)) {
              childGame.run('initPrepareGameEvents');
            }
          }

          this.emit('RESET');
        },
      },
    },
    { defaultResetHandler: true, allowedPlayers: this.players() }
  );
});
