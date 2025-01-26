() => ({
  init: function () {
    const { game, player: activePlayer } = this.eventContext();

    if (game.isSinglePlayer()) {
      const deck = game.find('Deck[domino]');
      const hand = activePlayer.find('Deck[domino]');

      deck.moveRandomItems({ count: 1, target: hand });

      return { resetEvent: true };
    } else {
      let diceFound = false;
      for (const player of game.players()) {
        if (player === activePlayer) continue;

        const deck = player.find('Deck[domino]');
        for (const dice of deck.select('Dice')) {
          dice.set({ eventData: { selectable: true } });
          diceFound = true;
        }
        player.set({ eventData: { showDecks: true } });
      }

      if (!diceFound) return { resetEvent: true };
    }
  },
  handlers: {
    RESET: function () {
      const { game, player: activePlayer } = this.eventContext();

      for (const player of game.players()) {
        if (player === activePlayer) continue;
        const deck = player.find('Deck[domino]');
        for (const dice of deck.select('Dice')) {
          dice.set({ eventData: { selectable: null } });
        }
        player.set({ eventData: { showDecks: null } });
      }

      this.destroy();
    },
    TRIGGER: function ({ targetId: fakeId, targetPlayerId }) {
      const { game, player: activePlayer } = this.eventContext();

      if (!fakeId || !targetPlayerId) return this.emit('RESET');

      const targetPlayer = game.get(targetPlayerId);
      if (!targetPlayer) return this.emit('RESET');

      const playerHand = activePlayer.find('Deck[domino]');
      const targetPlayerHand = targetPlayer.find('Deck[domino]');
      const handId = targetPlayerHand.id();

      const dice = targetPlayerHand
        .select('Dice')
        .find((dice) => dice.fakeId[handId] === fakeId || dice.id() === fakeId);
      if (!dice) return this.emit('RESET');

      // !!! взятая и выложенная на поле костяшка будет selectable для старого хозяина (в его ход)
      dice.set({ eventData: { selectable: null } });
      dice.moveToTarget(playerHand);

      game.logs({
        msg: `Игрок {{player}} стал целью события "${this.getTitle()}".`,
        userId: targetPlayer.userId,
      });

      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player: activePlayer } = this.eventContext();

      const players = game.players();
      const activePlayerIdx = players.indexOf(activePlayer);
      const sortedPlayers = players.slice(activePlayerIdx + 1).concat(players.slice(0, activePlayerIdx));
      const dices = sortedPlayers.reduce((arr, player) => {
        const sameTeam = false;
        if (sameTeam) return arr; // тут будет проверка на однокомандника
        return arr.concat(player.find('Deck[domino]').select('Dice'));
      }, []);
      const dice = dices[0];
      if (!dice) return this.emit('RESET');

      const playerHand = dice.parent();
      const player = playerHand.parent();
      this.emit('TRIGGER', {
        targetId: dice.fakeId[playerHand.id()],
        targetPlayerId: player.id(),
      });
    },
  },
});
