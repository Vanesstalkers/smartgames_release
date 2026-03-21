(class ReleaseGameUser extends lib.game.User() {
  async gameFinished(data = {}) {
    const {
      corporateGame,
      gameCode,
      playerEndGameStatus,
      gameAward,
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
    if (!rankings[gameCode]) rankings[gameCode] = {};
    const { games = 0, win = 0, money = 0, crutch = 0, penalty = 0, totalTime = 0 } = rankings[gameCode];

    let income = 0;
    let penaltySum = 0;
    if (endGameStatus === 'win') {
      penaltySum = 100 * crutchCount * 1000;
      income = gameAward * 1000 - penaltySum;
      rankings[gameCode].money = money + income;
      if (income < 0) income = 0; // в рейтинги отрицательный результата пишем
      rankings[gameCode].penalty = penalty + penaltySum;
      rankings[gameCode].crutch = crutch + crutchCount;
      rankings[gameCode].win = win + 1;
    }
    rankings[gameCode].games = games + 1;
    rankings[gameCode].totalTime = totalTime + roundCount;
    rankings[gameCode].avrTime = Math.floor(rankings[gameCode].totalTime / rankings[gameCode].win);

    const { steps } = getTutorial('game-tutorial-finished');
    const tutorial = clone(steps, { convertFuncToString: true });
    let incomeText = `${income.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₽`;
    if (penaltySum > 0)
      incomeText += ` (с учетом штрафа ${penaltySum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}₽ за костыли)`;
    tutorial[endGameStatus].text = tutorial[endGameStatus].text.replace('[[win-money]]', incomeText);

    // кастомное сообщение для пользователя
    for (const key in msg) tutorial[key].text = msg[key];

    this.set({ money: (this.money || 0) + income, helper: tutorial[endGameStatus], rankings });
    await this.saveChanges();
  }
  async corporateGameFinished({
    playerEndGameStatus,
    gameAward,
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
      income = gameAward * 1000 - penaltySum;
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
    await this.saveChanges();
  }

  getTutorial(formattedPath) {
    const path = formattedPath.split('-');

    let obj;
    if (path[0] === 'game') obj = lib.utils.getDeep(domain, ['game', 'corporate', ...path.slice(1)]);
    if (!obj) obj = lib.utils.getDeep(domain, path) || lib.utils.getDeep(lib, path);

    const tutorial = typeof obj === 'function' ? obj() : obj;
    if (!tutorial?.steps) throw new Error(`Tutorial "${formattedPath}" not found`);
    return tutorial;
  }
});
