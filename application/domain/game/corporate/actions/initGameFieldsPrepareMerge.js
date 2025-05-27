(function () {
  // промежуточный этап с отдельным добавлением зоны интеграции (не используется)

/*   const player = this.roundActivePlayer();
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

  // специально делаем через событие superGame, т.к.BEFORE_ADD_PLANE срабатывает для targetGame
  const superGame = this.game();
  superGame.initEvent(
    {
      name: 'initGameFieldsPrepareMerge',
      data: { ...data, mergedGame: this },
      init() {
        const game = this.data.mergedGame;
        const { game: superGame, player } = this.eventContext();

        superGame.broadcastEvent('DICES_DISABLED', { parent: game });
        this.showAvailablePorts();
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
          if (!plane.mergedGameId) {
            // сюда может попасть "обычный" plane, который добавляется после интеграции одной игры, но до интеграции следующей в конце раунда
            return { preventListenerRemove: true };
          }

          const game = this.data.mergedGame;

          if (initPlayer.gameId !== game.id()) {
            // тут активированные initGameFieldsPrepareMerge из других игр
            return { preventListenerRemove: true };
          }

          if (plane.anchorGameId) {
            this.showAvailablePorts();
            return { error: 'Этот блок уже был использован другой командой', preventListenerRemove: true };
          }

          // вся логика работы с игровым полем команды должна распространяться и на блок интеграции
          plane.set({ anchorGameId: game.id() });
        },
        ADD_PLANE({ target: plane, initPlayer }) {
          if (!plane.mergedGameId) return { preventListenerRemove: true };

          const game = this.data.mergedGame;
          if (game.id() !== initPlayer.gameId) {
            // тут активированные initGameFieldsPrepareMerge из других игр (т.к. поле поменялось, то нужно пересчитать availablePorts)
            this.showAvailablePorts();
            return { preventListenerRemove: true };
          }

          const endRoundTriggered = this.endRoundTriggered;
          this.emit('RESET');

          game.run('initGameFieldsMerge');
          if (endRoundTriggered) game.findEvent({ name: 'initGameFieldsMerge' }).emit('END_ROUND')
        },
        END_ROUND({ initPlayer }) {
          const game = this.data.mergedGame;

          if (initPlayer.gameId !== game.id()) return { preventListenerRemove: true };

          const { game: superGame, player } = this.eventContext();

          this.endRoundTriggered = true;

          // plane с наименьшим количеством зон
          const availablePort = player.eventData.availablePorts.map((_) => [superGame.get(_.joinPlaneId), _]).sort((a, b) => a[0].zonesCount() - b[0].zonesCount())[0][1];
          superGame.run('putPlaneOnField', availablePort, player);
        },
      },
      showAvailablePorts() {
        const game = this.data.mergedGame;
        const { game: superGame, player } = this.eventContext();
        const { startPlanes } = game.settings;
        const planeDeck = superGame.find('Deck[plane]');
        const integrationPlanes = planeDeck.select({ className: 'Plane', attr: { integrationPlane: true } }) // ключ integrationPlane должен проставляться при создании игры

        const filteredAvailablePorts = [];
        for (const plane of integrationPlanes) {
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
          // !!! тут проигрыш команды (ситуация чисто теоретическая, но должна быть описана логика, когда команд больше двух)
        }
        player.set({ eventData: { availablePorts: filteredAvailablePorts } });
      }
    },
    { player, allowedPlayers: superGame.players() }
  ); */
});
