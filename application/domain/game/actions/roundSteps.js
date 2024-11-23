(function () {
  const {
    round,
    settings: {
      // конфиги
      playerHandLimit,
      roundStartCardAddToPlayerHand,
      allowedAutoCardPlayRoundStart,
    },
  } = this;
  const gameDominoDeck = this.find('Deck[domino]');

  const checkDeletedDices = (player) => {
    const playerHand = player.find('Deck[domino]');

    // если есть временно удаленные dice, то восстанавливаем состояние до их удаления
    const deletedDices = this.run('getDeletedDices');
    let restoreAlreadyPlacedDice = false;
    for (const dice of deletedDices) {
      const zone = dice.getParent();

      // уже успели заменить один из удаленных dice - возвращаем его в руку player закончившего ход
      // (!!! если появятся новые источники размещения dice в zone, то этот код нужно переписать)
      const alreadyPlacedDice = zone.getNotDeletedItem();
      if (alreadyPlacedDice) {
        alreadyPlacedDice.moveToTarget(playerHand);
        restoreAlreadyPlacedDice = true;
      }

      // была размещена костяшка на прилегающую к Bridge зоне
      if (dice.relatedPlacement) {
        for (const relatedDiceId of Object.keys(dice.relatedPlacement)) {
          const relatedDice = this.get(relatedDiceId);
          relatedDice.moveToTarget(playerHand);
        }
      }

      dice.set({ deleted: null });
      zone.updateValues();
      for (const side of zone.sideList) {
        for (const linkCode of Object.values(side.links)) {
          const linkedSide = this.find(linkCode);
          const linkedZone = linkedSide.getParent();
          const linkedDice = linkedZone.getNotDeletedItem();

          const checkIsAvailable = !linkedDice || linkedZone.checkIsAvailable(linkedDice, { skipPlacedItem: true });
          if (checkIsAvailable === 'rotate') {
            // linkedDice был повернут после удаления dice
            linkedDice.set({ sideList: [...linkedDice.sideList.reverse()] });
            linkedZone.updateValues();
          }
        }
      }
    }
    if (deletedDices.length) {
      this.logs({
        msg:
          `Найдены удаленные, но не замененные костяшки. Вся группа удаленных костяшек была восстановлена на свои места.` +
          (restoreAlreadyPlacedDice
            ? ` Те костяшки, которые уже были размещены взамен этой группы, были возвращены обратно в руку игрока {{player}}.`
            : ''),
        userId: player.userId,
      });
    }
  };

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
    checkDeletedDices(roundActivePlayer);
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

  // обновляем таймер
  const actionsDisabled = newActivePlayer.eventData.actionsDisabled === true;
  const timerConfig = actionsDisabled ? { time: 5 } : {};
  newActivePlayer.activate(); // делаем строго после проверки actionsDisabled (внутри activate значение сбросится)
  lib.timers.timerRestart(this, timerConfig);

  const playerCardHand = newActivePlayer.find('Deck[card]');
  const card = this.run('smartMoveRandomCard', {
    target: roundStartCardAddToPlayerHand ? playerCardHand : this.decks.active,
  });
  // делаем после обновления таймера, в частности из-за карты "time"
  if (card && allowedAutoCardPlayRoundStart === true) {
    card.play({ player: newActivePlayer });
    newRoundLogEvents.push(`Активировано ежедневное событие "${card.title}".`);
  }

  return { newRoundLogEvents, newRoundNumber };
});
