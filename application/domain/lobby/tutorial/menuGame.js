/* eslint-disable max-len */
({
  utils: {
    ...lib.lobby.tutorial.menuGame.utils,
    async showGamesBlock(data) {
      const { $root } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки

      const $label = $root.querySelector('.menu-item.game:not(.pinned) label');
      if ($label) $label.click();

      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда
    },
    async transferToConfigBlock(data) {
      const { $root, utils } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки
      await utils.showGamesBlock(data);

      $root.querySelector('.game-block .select-btn.single').click();
      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда (для подсветки active-элементов)
    },
    async transferToSettingsBlock(data) {
      const { $root, utils } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки
      await utils.showGamesBlock(data);

      $root.querySelector('.game-config-block .select-btn.blitz').click();
      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда (для подсветки active-элементов)
    },
  },
  steps: {
    ...lib.lobby.tutorial.menuGame.steps,

    init: {
      initialStep: true,
      text: `
        Колода бизнес-карт РЕЛИЗ позволяет проводить <a>симуляции процессов ИТ-разработки</a>. Доступны несколько типов игр, включая одиночный и командный.
      `,
      actions: { before: async (data) => await data.utils.transferToGameTypeBlock(data) },
      buttons: [
        { text: 'Продолжай', step: 'type' },
        { text: 'Я разберусь', action: 'exit' },
      ],
    },
    type: {
      text: `
        Варианты игры:
        
        ФРИЛАНС - <a>игра для одного игрока</a>
        ДУЭЛЬ - <a>игра для двоих друг против друга</a>
        КАЖДЫЙ ЗА СЕБЯ - <a>игра для 3-х игроков</a>
        <span style="color: white; font-weight: bold;">ХАКАТОН - <a>формат корпоративной игры</a></span>
      `,
      actions: { before: async (data) => await data.utils.transferToGameTypeBlock(data) },
      active: '.game-block .select-btn:not(.disabled)',
      buttons: [{ text: 'Продолжай', step: 'config' }],
    },
    config: {
      text: `
        Режим игры определяет ее сложность:
        
        БЛИЦ - <a>быстрая и простая игра</a>
        СТАНДАРТ - <a>базовый режим</a>
        ХАРДКОР - <a>для тех, кто любит потруднее</a>
      `,
      actions: { before: async (data) => await data.utils.transferToConfigBlock(data) },
      active: '.game-config-block .select-btn',
      buttons: [{ text: 'Дальше', step: 'time' }],
    },
    time: {
      text: `
        На сложность игры так же влияет <a>значение&nbsp;таймера,&nbsp;доступного&nbsp;на&nbsp;ход</a>.
      `,
      actions: { before: async (data) => await data.utils.transferToSettingsBlock(data) },
      active: { selector: '.game-start-block .timer', css: { boxShadow: '0 0 20px 10px white', padding: '4px 10px' } },
      buttons: [{ text: 'Дальше', step: 'start' }],
    },
    start: {
      text: `
        Для начала игры необходимо нажать соответствующую кнопку. Еще могу рассказать про список игр, продолжать?
      `,
      actions: { before: async (data) => await data.utils.transferToSettingsBlock(data) },
      active: '.game-start-block .select-btn',
      buttons: [
        { text: 'Продолжай', step: 'list' }, // step из lib.lobby.tutorial.menuGame
        { text: 'Я разберусь', action: 'exit', exit: true },
      ],
    },

    settings: {
      ...lib.lobby.tutorial.menuGame.steps.settings,
      buttons: [{ text: 'Дальше', step: 'teams' }], // в оригинале - step='join'
    },
    teams: {
      text: `
        Это иконка для открытия список команд (<a>только у корпоративных игр</a>). Можно присоединиться к любой команде на выбор.
      `,
      active: [
        { selector: '.game-list-container .tutorial-games', css: { boxShadow: 'none' } },
        { selector: '.game-list-container .no-games-label', css: { display: 'none' } },
        { selector: '.game-list-container .show-teams', css: { boxShadow: '0 0 20px 10px white' } },
      ],
      actions: {
        before: async (data) => {
          const { $root, utils } = data;

          await utils.showGamesBlock(data);

          const $showTeamsBtn = $root.querySelector('.game-list-container .show-teams');
          if (!$showTeamsBtn.classList.contains('open')) $showTeamsBtn.click();
        },
      },
      buttons: [{ text: 'Дальше', step: 'join' }],
    },
  },
});
