(function ({ }, player) {
  player.set({ removed: true });

  const game = player.game();
  const superGame = game.game();

  const remainPlayers = game.players().filter(p => !p.removed);
  if (remainPlayers.length === 0 && game.status === 'PREPARE_START') {
    this.run('endGame', { canceledByUser: player.userId });
    return;
  }
  if (remainPlayers.length === 0 && game.status === 'IN_PROCESS') {
    game.run('initGameFieldsMerge');
    game.run('roundEnd');

    // делаем принципиально позже, т.к. игра добавится в turnOrder только после события ROUND_END
    this.set({
      turnOrder: this.turnOrder.filter((gameId) => gameId !== game.id()),
    });
  }

  const remainPlayersOverall = superGame.players().filter(p => !p.removed && p.ready).length;
  if (remainPlayersOverall <= 1) {
    this.run('endGame', { canceledByUser: player.userId });
    return;
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


  }
  if (player === game.roundActivePlayer()) game.run('roundEnd');
});
