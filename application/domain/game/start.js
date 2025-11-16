async () => {
  domain.game.configs.devMode = process.env.NODE_ENV === 'development';
  domain.game.configs.tutorialImgPrefix = domain.game.configs.devMode ? '' : '/release';

  {
    const files = await node.fsp.readdir('./application/static/img/cards', { withFileTypes: true });
    const cardTemplates = Object.values(files).map((_) => _.name);
    domain.game.configs.cardTemplates = cardTemplates;
    domain.game.configs.cardTemplates.random = ({ exclude = [] } = {}) => {
      const templates = cardTemplates.filter((_) => !exclude.includes(_));
      return templates[Math.floor(Math.random() * templates.length)];
    };
  }

  if (application.worker.id === 'W1') {
    db.redis.handlers.afterStart(async () => {
      async function connectToLobby() {
        const lobbyData = await db.redis.get('smartgamesLobby', { json: true });
        if (lobbyData) {
          const { channelName } = lobbyData;
          const gameTypes = lib.game.actions.getFilledGamesConfigs();
          const games = {};

          for (const [gameType, typeData] of Object.entries(gameTypes)) {
            const { items, itemsDefault = {}, ...typeInfo } = typeData;

            games[gameType] = typeInfo;
            games[gameType].items = {};

            for (const [gameConfig, configData] of Object.entries(items)) {
              let { title, timer, teamsCount, playerCount, maxPlayersInGame, playerList, style } = configData;
              if (!teamsCount) teamsCount = playerList.length;
              if (!playerCount) playerCount = playerList.length;
              if (!maxPlayersInGame) maxPlayersInGame = playerList.length;

              games[gameType].items[gameConfig] = { title, timer, teamsCount, playerCount, maxPlayersInGame, style };
            }
          }

          const url = 'https://smartgames.studio/release';
          lib.store.broadcaster.publishAction(channelName, 'gameServerConnected', {
            code: 'release',
            title: 'Релиз',
            icon: ['fas', 'microchip'],
            active: true,
            url: domain.game.configs.devMode ? 'http://localhost:8082' : url,
            serverUrl:
              domain.game.configs.devMode ? `http://localhost:${config.server.balancer}` : `${url}/api`,
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
