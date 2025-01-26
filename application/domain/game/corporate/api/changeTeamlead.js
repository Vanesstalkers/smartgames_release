async (context, { name } = {}) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const { gameId, playerId } = session;
  const game = lib.store('game').get(gameId);
  const player = game.get(playerId);

  if (!game) throw new Error('Не участвует в игре');

  player.initEvent(
    {
      init: function () {
        const { game, source: player } = this.eventContext();
        const playerId = player.id();

        const changes = {};
        for (const teamPlayer of game.players()) {
          if (teamPlayer.id() === playerId) continue;

          lib.utils.mergeDeep({
            target: changes,
            source: teamPlayer.prepareChanges({ eventData: { selectable: true } }),
          });
        }

        player.set({ eventData: { disableActivePlayerCheck: true } });
        lib.utils.mergeDeep({
          target: changes,
          source: player.prepareChanges({ eventData: { canSelectWorkers: true } }),
        });

        lib.store.broadcaster.publishAction(`user-${player.userId}`, 'broadcastToSessions', {
          type: 'updateStore',
          data: { game: { [game.game().id()]: { ...changes } } },
        });
      },
      handlers: {
        RESET: function () {
          const { game, source: player } = this.eventContext();

          const changes = {};
          for (const teamPlayer of game.players()) {
            if (teamPlayer.id() === playerId) continue;

            lib.utils.mergeDeep({
              target: changes,
              source: teamPlayer.prepareChanges({ eventData: { selectable: null } }),
            });
          }

          player.set({ eventData: { disableActivePlayerCheck: null } });
          lib.utils.mergeDeep({
            target: changes,
            source: player.prepareChanges({ eventData: { canSelectWorkers: null } }),
          });

          lib.store.broadcaster.publishData(`user-${player.userId}`, { helper: null, currentTutorial: null });
          lib.store.broadcaster.publishAction(`user-${player.userId}`, 'broadcastToSessions', {
            type: 'updateStore',
            data: { game: { [game.game().id()]: { ...changes } } },
          });

          this.destroy();
        },
        TRIGGER: function ({ target: targetPlayer }) {
          const { source: player } = this.eventContext();

          if (targetPlayer) {
            player.set({ teamlead: null });
            targetPlayer.set({ teamlead: true });
          }

          this.emit('RESET');
        },
      },
    },
    { allowedPlayers: [player] }
  );

  await game.saveChanges();
  return { status: 'ok' };
};
