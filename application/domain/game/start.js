async () => {
  if (application.worker.id === 'W1') {
    db.redis.handlers.afterStart(async () => {
      async function connectToLobby() {
        const lobbyData = await db.redis.get('lobbyData', { json: true });
        if (lobbyData) {
          const { channelName } = lobbyData;
          const gameTypes = domain.game.configs.gamesFilled();
          const games = {};

          for (const [gameType, typeData] of Object.entries(gameTypes)) {
            const { items, itemsDefault = {}, ...typeInfo } = typeData;

            games[gameType] = typeInfo;
            games[gameType].items = {};
            games[gameType].playerCount = [];

            for (const [gameConfig, configData] of Object.entries(items)) {
              const { title, timer, playerList } = configData;

              if (!games[gameType].playerCount.includes(playerList.length))
                games[gameType].playerCount.push(playerList.length);
              games[gameType].items[gameConfig] = {
                title,
                timer,
                playerCount: playerList.length,
              };
            }
          }

          const url = 'https://smartgames.studio/release';
          lib.store.broadcaster.publishAction(channelName, 'gameServerConnected', {
            code: 'release',
            title: 'Релиз',
            icon: ['fas', 'microchip'],
            active: true,
            url: process.env.NODE_ENV === 'development' ? 'http://localhost:8082' : url,
            serverUrl:
              process.env.NODE_ENV === 'development' ? `http://localhost:${config.server.balancer}` : `${url}/api`,
            games,
          });
          return;
        }
        setTimeout(async () => {
          await connectToLobby();
        }, 2000);
      }
      await connectToLobby();
    });
  }
};
