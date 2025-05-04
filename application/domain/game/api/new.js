async (context, { deckType, gameType, gameConfig, gameTimer, playerCount, maxPlayersInGame }) => {

  lib.game.flush.exec();

  const { sessionId, userId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  const { lobbyId } = session;

  try {

    const gameClassGetter = gameType === 'corporate' ? domain.game.corporate.classSuper : domain.game.class;
    const game = await new gameClassGetter().create({
      ...{ deckType, gameType, gameConfig, gameTimer },
      ...{ playerCount, maxPlayersInGame },
    });
    const gameId = game.id();

    for (const session of user.sessions()) {
      // на случай повторного вызова api до обработки playerJoin
      // (session.saveChanges будет выполнен в user.joinGame)
      session.set({ gameId });
    }

    lib.store.broadcaster.publishAction(`game-${gameId}`, 'playerJoin', {
      userId,
      userName: user.name || user.login,
      userAvatar: user.avatarCode,
    });

    lib.store.broadcaster.publishAction(`lobby-${lobbyId}`, 'addGame', {
      gameId,
      creator: { userId: user.id(), tgUsername: user.tgUsername },
      ...{ deckType, gameType, gameConfig, gameTimer, playerMap: game.playerMap },
    });

    return { status: 'ok', gameId };
  } catch (err) {
    if (err === 'player_count_not_exists') {
      user.set({
        gameId: null, playerId: null,
        helper: {
          text: 'Для создания игры необходимо указать количество игроков.',
          buttons: [{ text: 'Понятно, спасибо', action: 'exit' }],
        },
      });
      await user.saveChanges({ saveToLobbyUser: true });
    }
    return { status: 'error', logout: true };
  }
};
