({
  steps: {
    renameTeam: {
      pos: 'bottom-left',
      text: 'Необходимо указать новое имя команды.',
      input: { placeholder: 'Имя команды' },
      actions: {
        submit: (async (self, name) => {
          await api.action.call({ path: 'game.corporate.api.renameTeam', args: [{ name }] }).catch(prettyAlert);
          return { exit: true };
        }).toString(),
      },
      buttons: [
        { text: 'Готово', action: 'submit' },
        { text: 'Отмена', action: 'exit' },
      ],
    },
    changeTeamlead: {
      pos: 'bottom-right',
      text: 'Кого назначить тимлидом?',
      actions: {
        before: (async (self) => {
          await api.action.call({ path: 'game.corporate.api.changeTeamlead' }).catch(prettyAlert);
        }).toString(),
        reset: (async (self) => {
          await api.action.call({ path: 'game.api.action', args: [{ name: 'eventTrigger' }] }).catch(prettyAlert);
          return { exit: true };
        }).toString(),
      },
      buttons: [{ text: 'Отмена', action: 'reset' }],
    },
    restoreGame: {
      pos: 'bottom-left',
      text: 'Какой раунд игры восстановить?',
      input: { placeholder: 'последний', type: 'number' },
      actions: {
        submit: (async (self, round) => {
          await api.action.call({ path: 'game.corporate.api.restoreGame', args: [{ round }] }).catch(prettyAlert);
          return { exit: true };
        }).toString(),
      },
      buttons: [
        { text: 'Готово', action: 'submit' },
        { text: 'Отмена', action: 'exit' },
      ],
    },
  },
});
