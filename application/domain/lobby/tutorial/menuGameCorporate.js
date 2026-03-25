({
  utils: {
    async showGamesBlock(data) {
      const { $root } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки

      const $label = $root.querySelector('.menu-item.game:not(.pinned) label');
      if ($label) $label.click();
      await new Promise((resolve) => setTimeout(resolve, 100)); // ждем отрисовки фронтенда (тут 100, потому что есть анимация)
    },
    async transferToConfigBlock(data) {
      const {
        $root,
        utils,
        state: { isMobile },
      } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки

      if (isMobile) {
        $root.querySelectorAll('.menu-item.pinned:not(.game) label').forEach(($el) => $el.click());
      } else {
        await utils.showGamesBlock(data);
      }

      const $btn = $root.querySelector('.game-block .select-btn.corporate');
      if ($btn) $btn.click();
      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда
    },
    async transferToSettingsBlock(data) {
      const { $root, utils } = data; // в аргументах функции строго data, чтобы фронт корректно восстановил функцию из строки
      await utils.transferToConfigBlock(data);

      const $btn = $root.querySelector('.game-config-block .select-btn.competition');
      if ($btn) $btn.click(); // может не быть, так как для единственного конфига происходит автовыбор
      await new Promise((resolve) => setTimeout(resolve, 0)); // ждем отрисовки фронтенда (для подсветки active-элементов)
    },
  },
  steps: {
    ...lib.lobby.tutorial.menuGame.steps,

    init: {
      text: `
        Чтобы попасть в копроративный режим игры необходимо в ИГРОВОЙ КОМНАТЕ последовательно выбрать <a>РЕЛИЗ -> Хакатон</a>.  
      `,
      actions: { before: async (data) => await data.utils.transferToConfigBlock(data) },
      active: { selector: '.breadcrumbs', css: { boxShadow: 'inset 0 0 20px 10px white', padding: '30px 0px' } },
      buttons: [
        { text: 'Продолжай', step: 'corporate' },
      ],
    },
    corporate: {
      initialStep: true,
      text: `
        Данный режим предназначен для корпоративных игр и он представлен в двух форматах:

        СОРЕВНОВАНИЕ - <a>нескольких команд борются за победу</a>
        КООПЕРАЦИЯ - <a>игроки, разбитых на несколько групп, достигают общей цели</a>
      `,
      actions: { before: async (data) => await data.utils.transferToConfigBlock(data) },
      active: '.game-config-block .select-btn',
      buttons: [
        { text: 'Продолжай', step: 'timer' },
        { text: 'Я разберусь', action: 'exit' }
      ],
    },
    timer: {
      text: `
        Чем меньше таймер, тем сложнее победить. <a>Для первых игр рекомендуется ставить значение не менее 60 секунд на ход</a>.
      `,
      actions: { before: async (data) => await data.utils.transferToSettingsBlock(data) },
      active: { selector: '.game-start-block .timer', css: { boxShadow: '0 0 20px 10px white', padding: '4px 10px' } },
      buttons: [
        { text: 'Продолжай', step: 'rounds' }
      ],
    },
    rounds: {
      text: `
        Через установленное количество раундов игра прекратится и все участники будут признаны проигравшими.
      `,
      actions: { before: async (data) => await data.utils.transferToSettingsBlock(data) },
      active: { selector: '.game-start-block .rounds', css: { boxShadow: '0 0 20px 10px white', padding: '4px 10px' } },
      buttons: [
        { text: 'Дальше', step: 'teams' }
      ],
    },
    teams: {
      text: `
        Обязательно необходимо указать количество команд, которые будут участвовать в игре.
      `,
      actions: { before: async (data) => await data.utils.transferToSettingsBlock(data) },
      active: { selector: '.game-start-block .teams', css: { boxShadow: '0 0 20px 10px white', padding: '4px 10px' } },
      buttons: [
        { text: 'Дальше', step: 'start' }
      ],
    },
    start: {
      text: `
        Для начала игры необходимо нажать соответствующую кнопку.
      `,
      active: '.game-start-block .select-btn',
      buttons: [
        { text: 'Продолжай', step: 'teamsList' }, // step из lib.lobby.tutorial.menuGame
      ],
    },
    teamsList: {
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
      buttons: [{ text: 'Дальше', step: 'join' }], // step из lib.lobby.tutorial.menuGame
    },
  },
});
