({
  steps: {
    renameTeam: {
      pos: 'bottom-left',
      text: 'Необходимо указать новое имя команды.',
      input: { placeholder: 'Имя команды', name: 'title' },
      actions: {
        submit: async ({ inputData: { title } }) => {
          await api.action
            .call({ path: 'game.corporate.api.action', args: [{ name: 'renameTeam', data: { title, teamleadAction: true } }] })
            .catch(prettyAlert);
          return { exit: true };
        },
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
        before: async () => {
          await api.action
            .call({ path: 'game.corporate.api.action', args: [{ name: 'changeTeamlead', data: { teamleadAction: true } }] })
            .catch(prettyAlert);
        },
        reset: async () => {
          // так как target пустой, то вызовется только this.emit('RESET');
          await api.action.call({ path: 'game.api.action', args: [{ name: 'eventTrigger', data: { teamleadAction: true } }] }).catch(prettyAlert);
          return { exit: true };
        }
      },
      buttons: [{ text: 'Отмена', action: 'reset' }],
    },
    transferTable: {
      pos: 'bottom-left',
      text: 'Вернуть игровой стол на доработку?',
      actions: {
        submit: async () => {
          await api.action
            .call({ path: 'game.api.action', args: [{ name: 'returnFieldToHand', data: { teamleadAction: true } }] })
            .catch(prettyAlert);
          return { exit: true };
        }
      },
      buttons: [
        { text: 'Вернуть', action: 'submit' },
        { text: 'Отмена', action: 'exit' },
      ],
    },
    removePlayer: {
      pos: 'bottom-right',
      text: 'Кого удалить из команды?',
      actions: {
        before: async () => {
          await api.action
            .call({ path: 'game.corporate.api.action', args: [{ name: 'removePlayer', data: { teamleadAction: true } }] })
            .catch(prettyAlert);
        },
        reset: async () => {
          // так как target пустой, то вызовется только this.emit('RESET');
          await api.action.call({ path: 'game.api.action', args: [{ name: 'eventTrigger', data: { teamleadAction: true } }] }).catch(prettyAlert);
          return { exit: true };
        }
      },
      buttons: [{ text: 'Отмена', action: 'reset' }],
    },
    endRound: {
      pos: 'bottom-left',
      text: 'Завершить текущий раунд команды принудительно?',
      actions: {
        submit: async () => {
          await api.action
            .call({ path: 'game.api.action', args: [{ name: 'roundEnd', data: { teamleadAction: true } }] })
            .catch(prettyAlert);
          return { exit: true };
        }
      },
      buttons: [
        { text: 'Завершить раунд', action: 'submit' },
        { text: 'Отмена', action: 'exit' },
      ],
    },
  },
});
