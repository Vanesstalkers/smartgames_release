(class ReleaseGameUser extends lib.game.User() {
  async gameFinished(data = {}) {
    const {
      corporateGame,
      gameType,
      playerEndGameStatus,
      fullPrice,
      roundCount,
      crutchCount,
      msg = {},
      preventCalcStats = false,
    } = data;

    if (corporateGame) return this.corporateGameFinished(data);

    const {
      helper: { getTutorial },
      utils: { structuredClone: clone },
    } = lib;

    if (this.viewerId) {
      this.set({
        helper: {
          text: 'Игра закончена',
          buttons: [{ text: 'Выйти из игры', action: 'leaveGame' }],
          actions: {
            leaveGame: (async () => {
              await api.action.call({ path: 'game.api.leave', args: [] }).catch(window.prettyAlert);
              return { exit: true };
            }).toString(), // если без toString(), то нужно вызывать через helper.updateTutorial
          },
        },
      });
      await this.saveChanges();
      return;
    }

    if (preventCalcStats) return;

    const endGameStatus = playerEndGameStatus[this.id()];

    const rankings = clone(this.rankings || {});
    if (!rankings[gameType]) rankings[gameType] = {};
    const { games = 0, win = 0, money = 0, crutch = 0, penalty = 0, totalTime = 0 } = rankings[gameType];

    let income = 0;
    let penaltySum = 0;
    if (endGameStatus === 'win') {
      penaltySum = 100 * crutchCount * 1000;
      income = fullPrice * 1000 - penaltySum;
      rankings[gameType].money = money + income;
      if (income < 0) income = 0; // в рейтинги отрицательный результата пишем
      rankings[gameType].penalty = penalty + penaltySum;
      rankings[gameType].crutch = crutch + crutchCount;
      rankings[gameType].win = win + 1;
    }
    rankings[gameType].games = games + 1;
    rankings[gameType].totalTime = totalTime + roundCount;
    rankings[gameType].avrTime = Math.floor(rankings[gameType].totalTime / rankings[gameType].win);

    const { steps } = getTutorial('game-tutorial-finished');
    const tutorial = clone(steps, { convertFuncToString: true });
    let incomeText = `${income.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₽`;
    if (penaltySum > 0)
      incomeText += ` (с учетом штрафа ${penaltySum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}₽ за костыли)`;
    tutorial[endGameStatus].text = tutorial[endGameStatus].text.replace('[[win-money]]', incomeText);

    // кастомное сообщение для пользователя
    for (const key in msg) tutorial[key].text = msg[key];

    this.set({ money: (this.money || 0) + income, helper: tutorial[endGameStatus], rankings });
    await this.saveChanges({ saveToLobbyUser: true });
  }
  async corporateGameFinished({
    playerEndGameStatus,
    fullPrice,
    crutchCount,
    msg = {},
    preventCalcStats = false,
  } = {}) {
    const {
      helper: { getTutorial },
      utils: { structuredClone: clone },
    } = lib;

    if (this.viewerId) {
      this.set({
        helper: {
          text: 'Игра закончена',
          buttons: [{ text: 'Выйти из игры', action: 'leaveGame' }],
          actions: {
            leaveGame: (async () => {
              await api.action.call({ path: 'game.api.leave', args: [] }).catch(window.prettyAlert);
              return { exit: true };
            }).toString(), // если без toString(), то нужно вызывать через helper.updateTutorial
          },
        },
      });
      await this.saveChanges();
      return;
    }

    if (preventCalcStats) return;

    const endGameStatus = playerEndGameStatus[this.id()];

    let income = 0;
    let penaltySum = 0;
    if (endGameStatus === 'win') {
      penaltySum = 100 * crutchCount * 1000;
      income = fullPrice * 1000 - penaltySum;
      if (income < 0) income = 0; // в рейтинги отрицательный результата пишем
    }

    const { steps } = getTutorial('game-corporate-tutorial-finished');
    const tutorial = clone(steps, { convertFuncToString: true });
    let incomeText = `${income.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₽`;
    if (penaltySum > 0)
      incomeText += ` (с учетом штрафа ${penaltySum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}₽ за костыли)`;
    tutorial[endGameStatus].text = tutorial[endGameStatus].text.replace('[[win-money]]', incomeText);

    // кастомное сообщение для пользователя
    for (const key in msg) tutorial[key].text = msg[key];

    this.set({ helper: tutorial[endGameStatus] });
    await this.saveChanges({ saveToLobbyUser: true });
  }
});
