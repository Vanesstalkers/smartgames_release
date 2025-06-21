({
  steps: {
    hello: {
      initialStep: true,
      superPos: true,
      text: `
        Поздравляю, c началом твоей первой партии в игре РЕЛИЗ. <a>Я могу помочь освоиться с интерфейсом игры</a>.
      `,
      buttons: [
        { text: 'Продолжай', step: 'deckDice' },
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
        { text: 'Дальше', step: 'players' },
      ],
    },
    players: {
      text: `
        Это твои противники. Ты можешь увидеть сколько у них карт и костяшек домино в руке.
      `,
      actions: {
        before: ({ state }) => {
          const game = Object.values(state.store.game)[0];
          const skipStep = game.gameType === 'single' ? true : false;
          return { skipStep };
        },
      },
      active: ['.players .workers', '.players .player-hands', { selector: '.players .hand-dices', css: { boxShadow: '-30px -80px 60px 80px #f4e205' } }],
      buttons: [
        { text: 'Спасибо', step: 'exit' },
      ],
    },
    exit: {
      superPos: true,
      showMenu: true,
      active: '.helper-guru',
      text: `
        В левом верхнем углу иконка МЕНЮ ИГРОКА. С помощью него <a>можно повторно запустить любое обучение</a>.
      `,
      buttons: [
        { text: 'Понятно', action: 'exit' },
      ],
    },
  },
});
