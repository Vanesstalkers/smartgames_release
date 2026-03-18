async (context, { round } = {}) => {
  // восстановление игры через меню игрока
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const { gameId, lobbyId } = session;
  const game = lib.store('game').get(gameId);

  if (!game) throw new Error('Не участвует в игре');

  try {
    round = parseInt(round) || game.round;

    const { gameType } = game;
    const [dumpData] = await db.mongo.find(
      game.col() + '_dump',
      { _gameid: db.mongo.ObjectID(game.id()), round },
      { limit: 1 }
    );

    if (!dumpData) throw new Error('Копия для восстановления не найдена');

    // Очистка текущей игры
    for (const [channel] of game.channel().subscribers.entries()) {
      await lib.store.broadcaster.publishData.call(session, channel, game.wrapPublishData(null));
    }
    game.clearChanges(); // внутри removeGame вызовется saveChanges, так что очищаем лишнее, чтобы не поломать state на фронте
    await game.removeGame({ preventDeleteDumps: true });

    // Восстановление игры
    const restoredGame = await domain.game.actions.loadGame({ gameType, gameId, lobbyId, round });

    // Восстановление игроков и зрителей
    for (const player of [...Object.values(game.store.player), ...Object.values(game.store.viewer || {})]) {
      const { userId, ready } = player;

      if (!ready) continue; // игрок вышел из игры (через processPlayerLeave)

      const user = lib.store('user').get(userId);
      if (!user) continue;

      await user.joinGame({
        gameId: game.isSuperGame ? game.id() : player.gameId,
        playerId: player.id(),
        teamId: player.gameId,
      });
    }

    // Таймер на проверку активных игроков и запуск restart() для корпоративной игры
    if (gameType === 'corporate') {
      const startTime = Date.now();

      const tick = async () => {
        const teams = restoredGame.getAllGames();

        // Проверяем, что в каждой команде есть хотя бы один активный игрок
        const allTeamsHaveActive = teams.every((teamGame) => {
          const players = teamGame.players();
          if (!players.length) return false;
          return players.some((p) => p.active);
        });

        const elapsed = Date.now() - startTime;

        if (allTeamsHaveActive || elapsed >= 3000) {
          // По истечении 10 секунд дополнительно страхуемся ensureActiveAndTeamlead,
          // если вдруг где-то так и не появился активный игрок
          if (!allTeamsHaveActive) {
            for (const teamGame of teams) {
              if (typeof teamGame.ensureActiveAndTeamlead === 'function') {
                teamGame.ensureActiveAndTeamlead();
              }
            }
          }

          // Выставляем teamReady для команд, где хотя бы один игрок подключился
          for (const teamGame of teams) {
            const players = teamGame.players();
            const hasConnectedPlayer = players.some((p) => p.ready && p.userId);
            if (hasConnectedPlayer && !teamGame.eventData.teamReady) {
              teamGame.set({ eventData: { teamReady: true } });
            }
          }

          // Запускаем продолжение игры после восстановления
          restoredGame.restart();
          await restoredGame.saveChanges();
          return;
        }

        setTimeout(tick, 1000);
      };

      setTimeout(tick, 1000);
    }

    return { status: 'ok' };
  } catch (err) {
    console.log(err);
    context.client.emit('action/emit', {
      eventName: 'alert',
      data: { message: err.message, stack: err.stack },
    });
    return err;
  }
};
