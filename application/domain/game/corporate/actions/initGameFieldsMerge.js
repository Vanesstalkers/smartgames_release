(function () {
  const player = this.getActivePlayer();

  const tablePlanes = this.decks.table.items();
  for (const plane of tablePlanes) {
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

            const tablePlanes = game.decks.table.items();
            for (const plane of tablePlanes) {
              for (const event of plane.eventData.activeEvents) {
                event.emit('RESET');
              }
            }
          },
          END_ROUND: function () {
            const { game, source: plane } = this.eventContext();
            const superGame = game.game();
            const joinPlaneId = plane.id();
            superGame.run('showPlanePortsAvailability', { joinPlaneId });

            if (this.availablePorts.length) {
              const usedPort = superGame.availablePorts[0];
              superGame.run('putPlaneOnField', usedPort); // нельзя делать через pop/unshift из-за проверки внутри putPlaneOnField
            }
          },
        },
      },
      { player, allowedPlayers: [player] }
    );
  }
});
