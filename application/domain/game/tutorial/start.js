({
  steps: {
    hello: {
      initialStep: true,
      superPos: true,
      text: `
        Поздравляю, c началом твоей первой партии в игре РЕЛИЗ. <a>Я могу помочь освоиться с интерфейсом игры</a>.
      `,
      actions: {
        before: ({ state }) => {
          const { gameType, gameConfig } = Object.values(state.store.game)[0];
          if (gameType === 'corporate') return { skipStep: { goto: { step: gameConfig } } };
        },
      },
      buttons: [
        { text: 'Продолжай', step: 'deckDice' },
        { text: 'Я разберусь', step: 'exit' },
      ],
    },
    cooperative: {
      superPos: true,
      text: `
        Поздравляю, c началом твоей первой партии в игре РЕЛИЗ в режиме корпоративной кооперации. <a>Я расскажу тебе основную информацию о правилах игры</a>.
      `,
      buttons: [
        { text: 'Продолжай', action: 'changeTutorial', tutorial: 'game-corporate-tutorial-cooperative' },
        { text: 'Я разберусь', step: 'exit' },
      ],
    },
    competition: {
      superPos: true,
      text: `
        Поздравляю, c началом твоей первой партии в игре РЕЛИЗ в режиме корпоративного соревнования. <a>Я расскажу тебе основную информацию о правилах игры</a>.
      `,
      buttons: [
        { text: 'Продолжай', action: 'changeTutorial', tutorial: 'game-corporate-tutorial-competition' },
        { text: 'Я разберусь', step: 'exit' },
      ],
    },
    deckDice: {
      text: `
        Это счетчик оставшихся в колоде костяшек.
      `,
      active: { selector: '[code="Deck[domino]"]', css: { borderRadius: '50%' } },
      buttons: [
        { text: 'Дальше', step: 'deckCard' }
      ],
    },
    deckCard: {
      text: `
        Это счетчик оставшихся в колоде карт-событий.
      `,
      active: '[code="Deck[card]"]',
      buttons: [
        { text: 'Дальше', step: 'deckCardDrop' }
      ],
    },
    deckCardDrop: {
      text: `
        Это счетчик карт в колоде сброса.
      `,
      active: { selector: '[code="Deck[card_drop]"]', css: { filter: 'grayscale(0)' } },
      buttons: [
        { text: 'Дальше', step: 'playerTimer' },
      ],
    },
    playerTimer: {
      text: `
        Это таймер на ход. По истечении времени, ты принудительно закончишь раунд. При этом <a>все активные события будут завершены с автоматическим выбором целей</a> (если они требуются).
      `,
      pos: 'top-right',
      active: [
        '.player.iam .end-round-timer',
        { selector: '.player.iam .card-worker', css: { boxShadow: 'none' } },
      ],
      buttons: [
        { text: 'Дальше', step: 'playerEndRoundBtn' },
      ],
    },
    playerEndRoundBtn: {
      text: `
        Это кнопка окончания раунда. По нажатию ход закончится, а <a>все активные события будут завершены с автоматическим выбором целей</a> (если они требуются).
      `,
      pos: 'top-right',
      active: [
        '.player.iam .end-round-btn',
        { selector: '.player.iam .card-worker', css: { boxShadow: 'none' } },
      ],
      buttons: [
        { text: 'Дальше', step: 'exit' },
      ],
    },
    exit: {
      superPos: true,
      showMenu: true,
      active: '.helper-guru',
      text: `
        В левом верхнем углу иконка <a>МЕНЮ ИГРОКА</a>. С помощью него <a>можно повторно запустить любое обучение</a>. Так же рекомендую использовать <a>UI-подсказки (выделены на картинке)</a> - они дают более подробную информацию о раличных деталях интерфейса.
      `,
      img: '/img/tutorial/helper-links.png',
      buttons: [
        { text: 'Понятно', action: 'exit' },
      ],
    },
  },
});
