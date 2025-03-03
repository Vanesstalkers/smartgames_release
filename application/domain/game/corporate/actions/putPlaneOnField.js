(function ({ joinPortId, targetPortId, targetPortDirect, joinPortDirect }) {
  const joinPort = this.get(joinPortId);
  const joinPlane = joinPort.getParent();
  const targetPort = this.get(targetPortId);
  const joinGame = joinPort.game();
  const targetGame = targetPort.game();

  const { bridge } = this.run('domain.putPlaneOnField', ...arguments);

  const mergeFinished = joinGame !== targetGame && !joinGame.merged;
  if (mergeFinished) {
    const superGame = targetGame;

    joinGame.set({ merged: true });
    joinPlane.set({ mergedPlane: true });
    bridge.set({ mergedGameId: joinGame.id() });

    const joinGameId = joinGame.id();
    let turnOrder = superGame.turnOrder.filter((id) => id !== joinGameId);
    turnOrder.push(joinGameId);
    superGame.set({ turnOrder });

    const gameCommonDominoDeck = joinGame.find('Deck[domino_common]');
    const gameCommonCardDeck = joinGame.find('Deck[card_common]');
    for (const player of joinGame.players()) {
      player.find('Deck[domino]').moveAllItems({ target: gameCommonDominoDeck, markNew: true });
      player.find('Deck[card]').moveAllItems({ target: gameCommonCardDeck, markNew: true });
    }

    const currentRound = superGame.round;
    joinGame.run('updateRoundStep');
    if (superGame.allGamesMerged()) {
      if (currentRound !== superGame.round) {
        // раунд обновился, т.к. это была последняя игра с roundReady == false - принудительно завершать раунды в других играх не нужно, т.к. это будет уже завершение нового раунда
        return;
      }

      // принудительно завершаем раунды всех игр, чтобы переключиться на чередование раундов между играми
      for (const game of superGame.getAllGames()) {
        if (!game.roundReady) game.run('updateRoundStep');
      }
    }
  }
});
