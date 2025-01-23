({
  steps: {
    restore: {
      initialStep: true,
      pos: 'bottom-left',
      text: 'Какой раунд игры восстановить?',
      html: ((game) => `
        <div v-if="menu.input" class="input">
          <input value="${game.round}" placeholder="${game.round}" name="restoreGameInput" type="number" min="1" max="${game.round}" />
        </div>
      `).toString(),
      actions: {
        submit: (async (inputData, self) => {
          await api.action
            .call({ path: 'game.api.restoreGame', args: [{ round: inputData['restoreGameInput'] }] })
            .catch(prettyAlert);
          return { exit: true };
        }).toString(),
      },
      buttons: [
        { text: 'Выполнить', action: 'submit' },
        { text: 'Отмена', action: 'exit' },
      ],
    },
  },
});
