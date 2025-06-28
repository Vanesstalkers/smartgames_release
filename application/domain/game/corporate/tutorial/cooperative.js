({
  steps: {
    hello: {
      initialStep: true,
      superPos: true,
      text: `
        Цель игры РЕЛИЗ в кооперативном режиме заключается в том, что <a>команды должны совместно заполнить все блоки на поле</a>, при этом уложившись в лимит раундов.
      `,
      img: '/img/tutorial/cooperative-win.png',
      buttons: [
        { text: 'Продолжай', step: 'rounds' },
        { text: 'Я разберусь', step: 'exit' },
      ],
    },
    rounds: {
      superPos: true,
      text: `
        На первом этапе <a>команды совершают действия одновременно</a>. При этом <a>новый раунд не начинается, пока все команды не завершат предыдущий</a>. Каждый раунд внутри каждой команды меняется активный игрок.
      `,
      buttons: [
        { text: 'Продолжай', step: 'foreignTable' },
      ],
    },
    foreignTable: {
      superPos: true,
      text: `
        Игрокам одной команды <a>разрешено выкладывать костяшки на игровой стол другой команды</a>. Так же <a>разрешено выбирать целями карт-событий игроков и игровой стол другой команды</a>. То есть <a>команды могут помогать друг другу заполнить все блоки поля</a>.
      `,
      buttons: [
        { text: 'Продолжай', step: 'merge' },
      ],
    },
    merge: {
      superPos: true,
      text: `
        !!!!
      `,
      img: '/img/tutorial/cooperative-merge.png',
      buttons: [
        { text: 'Продолжай', step: 'exit' },
      ],
    },
    // { text: 'Продолжай', action: 'changeTutorial', tutorial: 'game-tutorial-start', step: 'deckDice' },
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
