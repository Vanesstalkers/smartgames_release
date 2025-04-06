() => ({
  fakeIdMapping: {},
  init: function () {
    const { game, player: activePlayer } = this.eventContext();

    if (game.isSinglePlayer()) {
      const deck = game.find('Deck[domino]');
      const hand = activePlayer.find('Deck[domino]');

      deck.moveRandomItems({ count: 1, target: hand });

      return { resetEvent: true };
    } else {
      const eventData = { dice: {}, player: {} };
      for (const player of game.players()) {
        if (player === activePlayer) continue;

        const deck = player.find('Deck[domino]');
        for (const dice of deck.select('Dice')) {
          const diceId = dice.id();
          let visibleDiceId = diceId;
          if (!dice.visible) {
            const fakeId = dice.fakeId[deck.id()];
            visibleDiceId = fakeId;
            this.fakeIdMapping[fakeId] = diceId;
          }
          eventData.dice[visibleDiceId] = { selectable: true };
        }
        eventData.player[player.id()] = { showDecks: true };
      }
      activePlayer.set({ eventData });

      if (Object.keys(eventData.dice).length === 0) return { resetEvent: true };
    }
  },
  handlers: {
    RESET: function () {
      const { game, player: activePlayer } = this.eventContext();
      activePlayer.set({ eventData: { dice: null, player: null } });
      this.destroy();
    },
    TRIGGER: function ({ targetId: fakeId, targetPlayerId }) {
      const { game, player: activePlayer } = this.eventContext();

      if (!fakeId || !targetPlayerId) return this.emit('RESET');

      const { targetPlayer, targetPlayerHand, handId } = this.getTargetPlayer({ targetPlayerId });
      if (!targetPlayer) return this.emit('RESET');

      const playerHand = activePlayer.find('Deck[domino]');

      const dice = targetPlayerHand
        .select('Dice')
        .find((dice) => dice.fakeId[handId] === fakeId || dice.id() === fakeId);
      if (!dice) return this.emit('RESET');

      dice.moveToTarget(playerHand);

      game.logs({
        msg: `Игрок {{player}} стал целью события "${this.getTitle()}".`,
        userId: targetPlayer.userId,
      });

      this.emit('RESET');
    },
    END_ROUND: function () {
      const dice = this.getRandomDice();
      if (!dice) return this.emit('RESET');

      const playerHand = dice.parent();
      const player = playerHand.parent();
      this.emit('TRIGGER', {
        targetId: dice.fakeId[playerHand.id()],
        targetPlayerId: player.id(),
      });
    },
  },
  getTargetPlayer({ targetPlayerId }) {
    const { game } = this.eventContext();
    const targetPlayer = game.get(targetPlayerId);
    const targetPlayerHand = targetPlayer?.find('Deck[domino]');
    const handId = targetPlayerHand?.id();
    return { targetPlayer, targetPlayerHand, handId };
  },
  getRandomDice() {
    const { game, player: activePlayer } = this.eventContext();
    const diceId = Object.keys(activePlayer.eventData.dice)[0];
    return game.get(this.fakeIdMapping[diceId] || diceId);
  }
});
