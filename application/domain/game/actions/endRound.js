(function ({ resetActivePlayer } = {}) {
  const {
    round,
    settings: {
      // конфиги
      playerHandLimit,
      roundStartCardAddToPlayerHand,
      allowedAutoCardPlayRoundStart,
    },
  } = this;

  // player чей ход только что закончился (получаем принципиально до вызова changeActivePlayer)
  const prevPlayer = this.getActivePlayer();
  const prevPlayerHand = prevPlayer.find('Deck[domino]');

  if (round > 0) {
    this.logs(
      {
        msg: `Игрок {{player}} закончил раунд №${round}.`,
        userId: prevPlayer.userId,
      },
      { consoleMsg: true }
    );
  }

  this.toggleEventHandlers('END_ROUND');

  // player которому передают ход
  const activePlayer = this.changeActivePlayer({ resetActivePlayer });
  const playerHand = activePlayer.find('Deck[domino]');
  const playerCardHand = activePlayer.find('Deck[card]');
  const gameDominoDeck = this.find('Deck[domino]');

  // если есть временно удаленные dice, то восстанавливаем состояние до их удаления
  const deletedDices = this.run('getDeletedDices');
  let restoreAlreadyPlacedDice = false;
  for (const dice of deletedDices) {
    const zone = dice.getParent();

    // уже успели заменить один из удаленных dice - возвращаем его в руку player закончившего ход
    // (!!! если появятся новые источники размещения dice в zone, то этот код нужно переписать)
    const alreadyPlacedDice = zone.getNotDeletedItem();
    if (alreadyPlacedDice) {
      alreadyPlacedDice.moveToTarget(prevPlayerHand);
      restoreAlreadyPlacedDice = true;
    }

    // была размещена костяшка на прилегающую к Bridge зоне
    if (dice.relatedPlacement) {
      for (const relatedDiceId of Object.keys(dice.relatedPlacement)) {
        const relatedDice = this.get(relatedDiceId);
        relatedDice.moveToTarget(prevPlayerHand);
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
      userId: prevPlayer.userId,
    });
  }

  if (prevPlayerHand.itemsCount() > playerHandLimit) {
    // слишком много доминошек в руке
    if (!prevPlayer.eventData.disablePlayerHandLimit) {
      prevPlayerHand.moveAllItems({ target: gameDominoDeck });
      this.logs({
        msg: `У игрока {{player}} превышено максимальное количество костяшек в руке на конец хода. Все его костяшки сброшены в колоду.`,
        userId: prevPlayer.userId,
      });
    }
  }
  prevPlayer.set({ eventData: { disablePlayerHandLimit: null } });

  gameDominoDeck.moveRandomItems({ count: 1, target: playerHand });

  const playedCards = this.decks.active.select('Card');
  for (const card of playedCards) {
    if (!card.isPlayOneTime()) card.set({ played: null });
    card.moveToTarget(this.decks.drop);
  }

  this.checkCrutches();

  const newRoundNumber = round + 1;
  const newRoundLogEvents = [];
  newRoundLogEvents.push(`Начало раунда №${newRoundNumber}.`);

  const card = this.run('smartMoveRandomCard', {
    target: roundStartCardAddToPlayerHand ? playerCardHand : this.decks.active,
  });
  if (card && allowedAutoCardPlayRoundStart === true) {
    card.play({ player: activePlayer });
    newRoundLogEvents.push(`Активировано ежедневное событие "${card.title}".`);
  }

  // обновляем таймер
  const actionsDisabled = activePlayer.eventData.actionsDisabled === true;
  const timerConfig = actionsDisabled ? { time: 5 } : {};
  lib.timers.timerRestart(this, timerConfig);

  // обновляем логи
  for (const logEvent of newRoundLogEvents) this.logs(logEvent);

  this.set({ statusLabel: `Раунд ${newRoundNumber}`, round: newRoundNumber });
});
