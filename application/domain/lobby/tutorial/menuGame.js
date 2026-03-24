/* eslint-disable max-len */
({
  utils: lib.lobby.tutorial.menuGame.utils,
  steps: {
    ...lib.lobby.tutorial.menuGame.steps,
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
