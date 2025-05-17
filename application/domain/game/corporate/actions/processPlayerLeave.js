(function ({ }, player) {

  const playerId = player.id();
  const game = player.game();
  const superGame = game.game();

  player.set({ ready: false });
  const remainPlayers = game.players().filter(p => p.ready);
  const remainPlayersOverall = superGame.players().filter(p => p.ready).length;

  if (remainPlayersOverall <= 0) return this.run('endGame');

  if (game.status === 'IN_PROCESS') {
    if (game.gameConfig === 'cooperative') {
      if (remainPlayers.length === 0) {
        if (!game.merged) game.run('initGameFieldsMerge');
        else {
          this.set({
            turnOrder: this.turnOrder.filter((gameId) => gameId !== game.id()),
          });
        }
      }
    }
    if (game.gameConfig === 'competition') {
      const roundPool = superGame.roundPool;
      if (!game.merged) {
        const commonRound = roundPool.get('common');
        const commonRoundGames = commonRound.data.filter((g) => g !== game);
        roundPool.update('common', commonRoundGames);
        if (commonRoundGames.length === 0) roundPool.setActive('common', false);
      } else {
        roundPool.setActive(game.id(), false);
      }
    }
  }

  if (remainPlayers.length > 0) {
    const isCommonHand = game.merged;
    if (!isCommonHand) {
      const diceHands = remainPlayers.map((p) => p.find('Deck[domino]'));
      const dices = player.find('Deck[domino]').items();
      for (let i = 0; i < dices.length; i++) {
        const dice = dices[i];
        dice.moveToTarget(diceHands[i % diceHands.length]); // внутри сработает markDelete
        dice.markNew();
      }
    }
    const cardHands = remainPlayers.map((p) => p.find('Deck[card]'));
    const cards = player.find('Deck[card]').items();
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      card.moveToTarget(cardHands[i % cardHands.length]); // внутри сработает markDelete
      card.markNew();
    }


    if (player.teamlead) {
      const targetPlayer = remainPlayers[0];
      targetPlayer.set({ teamlead: true });

      game.logs({
        msg: `Игрок {{player}} стал новым тимлидом команды.`,
        userId: targetPlayer.userId,
      });
    }
  }
  if (player === game.roundActivePlayer()) game.run('roundEnd');

  player.markDelete();
  player.set({ userId: null, teamlead: null });
  game.set({ playerMap: { [playerId]: null } });
  this.set({ playerMap: { [playerId]: null }, gamesMap: { [game.id()]: { [playerId]: null } } }); // игрок пропадет из game.player(), но остается в store (нужно, чтобы корректно отработал END_ROUND у initGameFieldsMerge)
});
