(function ({ }, player) {
  player.set({ ready: false });

  const game = player.game();
  const superGame = game.game();

  const remainPlayers = game.players().filter(p => p.ready);
  const remainPlayersOverall = superGame.players().filter(p => p.ready).length;

  if (game.status !== 'IN_PROCESS' && remainPlayers.length === 0) {
    return this.run('endGame');
  }

  if (game.status === 'IN_PROCESS') {

    if (remainPlayersOverall <= 1) {
      return this.run('endGame', { canceledByUser: player.userId });
    }

    if (remainPlayers.length === 0) {
      game.run('initGameFieldsMerge');
      game.run('roundEnd');

      // делаем принципиально позже, т.к. игра добавится в turnOrder только после события ROUND_END
      this.set({
        turnOrder: this.turnOrder.filter((gameId) => gameId !== game.id()),
      });
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
      player.set({ teamlead: null });

      const targetPlayer = remainPlayers[0];
      targetPlayer.set({ teamlead: true });

      game.logs({
        msg: `Игрок {{player}} стал новым тимлидом команды.`,
        userId: targetPlayer.userId,
      });
    }
  }
  if (player === game.roundActivePlayer()) game.run('roundEnd');
});
