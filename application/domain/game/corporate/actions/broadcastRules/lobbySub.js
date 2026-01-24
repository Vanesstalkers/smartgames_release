(data) => {
  const result = {};
  if (data.round !== undefined) result.round = data.round;
  if (data.status !== undefined) result.status = data.status;
  if (data.gameCode !== undefined) result.gameCode = data.gameCode;
  if (data.gameType !== undefined) result.gameType = data.gameType;
  if (data.gameConfig !== undefined) result.gameConfig = data.gameConfig;
  if (data.gameTimer !== undefined) result.gameTimer = data.gameTimer;
  if (data.playerMap !== undefined) result.playerMap = data.playerMap;
  if (data.gamesMap !== undefined) result.gamesMap = data.gamesMap;

  if (data.store) {
    result.store = {};
    if (data.store.game !== undefined) {
      const games = {};
      for (const [id, val] of Object.entries(data.store.game)) {
        const { playerMap, title } = val;
        games[id] = { playerMap, title };
      }
      if (Object.keys(games).length > 0) result.store.game = games;
    }
    if (data.store.player !== undefined) {
      const players = {};
      for (const [id, val] of Object.entries(data.store.player)) {
        const player = {};
        // !!! проверить удаленного player-аы
        if (val === null) { // player физически удален
          players[id] = player;
          continue;
        }
        if (val.ready !== undefined) player.ready = val.ready;
        if (Object.keys(player).length > 0) players[id] = player;
      }
      if (Object.keys(players).length > 0) result.store.player = players;
    }
    if (Object.keys(result.store).length === 0) delete result.store;
  }
  return result;
};
