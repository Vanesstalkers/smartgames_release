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

  // специально делаем через событие superGame, чтобы отловить событие ADD_PLANE в других играх
  const superGame = this.game();
  superGame.initEvent(
    {
      name: 'initGameFieldsPrepareMerge',
      data: {
        ...data,
        targetGame: this,
        integrationPlanes: new Set(),
      },
      init() {
        const game = this.data.targetGame;
        const { game: superGame, player } = this.eventContext();
        const { startPlanes, integrationPlanes } = game.settings;
        const planeDeck = superGame.find('Deck[plane]');

        superGame.broadcastEvent('DICES_DISABLED', { parent: game });

        this.data.integrationPlanes = integrationPlanes.map((code) => planeDeck.find(code));

        const filteredAvailablePorts = [];
        for (const plane of this.data.integrationPlanes) {
          if (!plane) continue; // уже мог быть использован ранее другой командой

          plane.set({ eventData: { integrationPlane: true } }); // !!! по-хорошему нужно пернести в fillGameData

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
          const { game: superGame, player } = this.eventContext();

          player.set({ eventData: { availablePorts: [] } });

          this.destroy();
        },
        BEFORE_ADD_PLANE({ target: plane, initPlayer }) {
          const game = this.data.targetGame;
          if (game !== initPlayer.game()) return { preventListenerRemove: true, preventSaveResult: true };

          const { game: superGame, player } = this.eventContext();
          const planeDeck = superGame.find('Deck[plane]');

          if (plane.parent() !== planeDeck) {
            player.set({
              eventData: {
                availablePorts: player.eventData.availablePorts.filter(({ joinPlaneId }) => joinPlaneId !== plane.id())
              }
            });
            // if(this.endRoundTriggered)
            return { error: 'Этот блок уже был использован другой командой', preventListenerRemove: true };
          }
        },
        ADD_PLANE({ target: plane, initPlayer }) {
          const game = this.data.targetGame;
          if (game !== initPlayer.game()) return { preventListenerRemove: true, preventSaveResult: true };

          const endRoundTriggered = this.endRoundTriggered;
          this.emit('RESET');

          game.run('initGameFieldsMerge');
          if (endRoundTriggered) game.findEvent({ name: 'initGameFieldsMerge' }).emit('END_ROUND')
        },
        END_ROUND() {
          const { game: superGame, player } = this.eventContext();

          this.endRoundTriggered = true;

          const availablePort = player.eventData.availablePorts[0];
          superGame.run('putPlaneOnField', availablePort, player);
        },
      },
    },
    { player, allowedPlayers: superGame.players() }
  );
});
