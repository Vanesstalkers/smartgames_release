() => ({
  steps: {
    ...lib.game.tutorial.links.steps,
    readyBtn: {
      pos: 'bottom-right',
      text: 'Для начала игры нажми кнопку "Готов" и ожидай остальных игроков',
      active: '.player.iam .card-worker',
      buttons: [{ text: 'Понятно, спасибо', action: 'exit' }],
    },
  },
});
