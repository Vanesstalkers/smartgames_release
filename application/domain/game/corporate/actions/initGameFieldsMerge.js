(function () {
  const player = this.getActivePlayer();
  for (const plane of this.decks.table.items()) {
    plane.initEvent(
      {
        init: function () {
          const { game, source: plane } = this.eventContext();
          const superGame = game.game();
          for (const port of plane.select('Port')) {
            superGame.run('showPlanePortsAvailability', { joinPortId: port.id() });
            if (superGame.availablePorts.length > 0) {
              port.set({ eventData: { selectable: true } });
            }
          }
        },
        handlers: {
          RESET: function () {
            const { game, source: plane, sourceId } = this.eventContext();

            for (const port of plane.select('Port')) {
              port.set({ eventData: { selectable: null } });
            }

            plane.removeEvent(this);
            player.removeEvent(this);
            game.removeAllEventListeners({ sourceId });
          },
          TRIGGER: function ({ target: port }) {
            const { game, player } = this.eventContext();

            game.game().run('showPlanePortsAvailability', { joinPortId: port.id() }, player);

            return { preventListenerRemove: true };
          },
          ADD_PLANE: function () {
            const { game } = this.eventContext();
            game.set({ merged: true });
            this.emit('RESET');
          },
        },
      },
      { player, allowedPlayers: [player] }
    );
  }
});
