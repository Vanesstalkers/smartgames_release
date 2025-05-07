(function () {
  const player = this.roundActivePlayer();
  const {
    data,
    handlers: {
      //
      NO_AVAILABLE_PORTS,
      TRIGGER_EXTRA_PLANE,
      CHECK_AVAILABLE_PORTS,
      CHECK_PLANES_IN_HANDS,
      TRIGGER,
    },
  } = domain.game.events.common.putPlaneFromHand();

  this.initEvent(
    {
      name: 'initGameFieldsPrepareMerge',
      data: {
        ...data,
        integrationPlanes: new Set(),
      },
      init() {
        const { game, player } = this.eventContext();
        const { startPlanes, integrationPlanes } = game.settings;
        const superGame = game.game();
        const planeDeck = superGame.find('Deck[plane]');

        superGame.broadcastEvent('DICES_DISABLED', { parent: game });

        this.data.integrationPlanes = integrationPlanes.map((code) => planeDeck.find(code));

        const filteredAvailablePorts = [];
        for (const plane of this.data.integrationPlanes) {
          if (!plane) continue; // уже мог быть использован ранее другой командой

          plane.set({ anchorGameId: game.id() });

          for (const port of plane.ports()) {
            const availablePorts = superGame.run('showPlanePortsAvailability', { joinPortId: port.id() }, player);

            filteredAvailablePorts.push(...availablePorts.filter(({ targetPlaneId }) => {
              const targetPlane = superGame.get(targetPlaneId);
              return startPlanes.includes(targetPlane.code.replace(planeDeck.code, '')); // нельзя мерджиться к чужим блокам интеграции 
            }));
          }
        }

        if (filteredAvailablePorts.length === 0) {
          return this.emit('RESET');
          // тут проигрыш команды (ситуация чисто теоретическая, но должна быть описана логика, когда команд больше двух)
        }
        player.set({ eventData: { availablePorts: filteredAvailablePorts } });
      },
      handlers: {
        NO_AVAILABLE_PORTS,
        TRIGGER_EXTRA_PLANE,
        CHECK_PLANES_IN_HANDS,
        CHECK_AVAILABLE_PORTS,
        TRIGGER,
        RESET() {
          const { game, player } = this.eventContext();
          const superGame = game.game();
          const planeDeck = superGame.find('Deck[plane]');

          player.set({ eventData: { availablePorts: [] } });
          for (const plane of this.data.integrationPlanes) {
            if (plane.parent() !== planeDeck) continue
            plane.set({ anchorGameId: null });
          }

          this.destroy();
        },

        ADD_PLANE({ target: plane }) {

          const { game, player } = this.eventContext();
          const endRoundTriggered = this.endRoundTriggered;
          this.emit('RESET');

          game.run('initGameFieldsMerge');
          if (endRoundTriggered) game.findEvent({ name: 'initGameFieldsMerge' }).emit('END_ROUND')
        },
        END_ROUND() {
          const { game, player } = this.eventContext();
          const superGame = game.game();

          this.endRoundTriggered = true;

          const availablePort = player.eventData.availablePorts[0];
          superGame.run('putPlaneOnField', availablePort, player);
        },
      },
    },
    { player }
  );
});
