({
  steps: {
    renameTeam: {
      pos: 'bottom-left',
      text: 'Необходимо указать новое имя команды.',
      input: { placeholder: 'Имя команды' },
      actions: {
        submit: (async (self, name) => {
          await api.action
            .call({ path: 'game.corporate.api.action', args: [{ action: 'renameTeam', data: { name } }] })
            .catch(prettyAlert);
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
        before: (async (inputData, self) => {
          await api.action
            .call({
              path: 'game.corporate.api.action',
              args: [{ teamleadAction: true, name: 'changeTeamlead' }],
            })
            .catch(prettyAlert);
        }).toString(),
        reset: (async (inputData, self) => {
          // так как target пустой, то вызовется только this.emit('RESET');
          await api.action.call({ path: 'game.api.action', args: [{ name: 'eventTrigger' }] }).catch(prettyAlert);
          return { exit: true };
        }).toString(),
      },
      buttons: [{ text: 'Отмена', action: 'reset' }],
    },
    transferTable: {
      pos: 'bottom-left',
      text: 'Вернуть игровой стол на доработку?',
      actions: {
        submit: (async (inputData, self) => {
          await api.action
            .call({ path: 'game.api.action', args: [{ name: 'returnFieldToHand', data: { teamleadAction: true } }] })
            .catch(prettyAlert);
          return { exit: true };
        }).toString(),
      },
      buttons: [
        { text: 'Вернуть', action: 'submit' },
        { text: 'Отмена', action: 'exit' },
      ],
    },
  },
});
