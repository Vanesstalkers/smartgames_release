(function () {
  const {
    round,
    settings: {
      // конфиги
      playerHandLimit,
      roundStartCardAddToPlayerHand,
    },
  } = this;
  const gameDominoDeck = this.find('Deck[domino]');

  const checkPlayerHandLimit = (player) => {
    const hand = player.find('Deck[domino]');
    if (hand.itemsCount() > playerHandLimit) {
      // слишком много доминошек в руке
      if (!player.eventData.disablePlayerHandLimit) {
        hand.moveAllItems({ target: gameDominoDeck });

        this.logs({
          msg: `У игрока {{player}} превышено максимальное количество костяшек в руке на конец хода. Все его костяшки сброшены в колоду.`,
          userId: player.userId,
        });
      }
    }
    player.set({ eventData: { disablePlayerHandLimit: null } });
  };

  const roundActivePlayer = this.roundActivePlayer();
  if (round > 0 && roundActivePlayer) {
    checkPlayerHandLimit(roundActivePlayer);
  }

  const newActivePlayer = this.selectNextActivePlayer();

  const playerHand = newActivePlayer.find('Deck[domino]');
  gameDominoDeck.moveRandomItems({ count: 1, target: playerHand });

  const playedCards = this.decks.active.select('Card');
  for (const card of playedCards) {
    if (!card.playOneTime) card.set({ played: null });
    card.moveToTarget(this.decks.drop);
  }

  this.checkCrutches();

  const newRoundNumber = round + 1;
  const newRoundLogEvents = [];
  newRoundLogEvents.push(`Начало раунда №${newRoundNumber}.`);

  const smartMoveRandomCardTarget = roundStartCardAddToPlayerHand
    ? newActivePlayer.find('Deck[card]')
    : this.decks.active;
  this.run('smartMoveRandomCard', { target: smartMoveRandomCardTarget });

  // обновляем таймер
  const actionsDisabled = newActivePlayer.eventData.actionsDisabled === true;
  const timerConfig = actionsDisabled ? { time: 5 } : null;
  this.set({ lastRoundTimerConfig: timerConfig }); // нужно для восстановления игры
  newActivePlayer.activate(); // делаем строго после проверки actionsDisabled (внутри activate значение сбросится)

  return { newRoundLogEvents, newRoundNumber };
});
