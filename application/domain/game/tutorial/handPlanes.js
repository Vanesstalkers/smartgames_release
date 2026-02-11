({
  steps: {
    planes: {
      initialStep: true,
      pos: 'top-right',
      text: `
        Выбери один из блоков в руке. Стоимость блока добавится к общей сумме выигрыша.
      `,
      active: '.plane.in-hand',
      buttons: [
        { text: 'Продолжай', step: 'availablePlacement' },
        { text: 'Я разберусь', action: 'exit', exit: true },
      ],
    },
    availablePlacement: {
      pos: 'top-right',
      text: `
        Выбери к какому блоку его присоединить (если поле было пустое, то размещение произойдет автоматически).
      `,
      img: '/img/tutorial/available-placement.png',
      buttons: [{ text: 'Продолжай', step: 'agree' }],
    },
    agree: {
      pos: 'top-right',
      text: `
        Для подтверждения размещения блока нажми <a>Сделать выбор</a>.
      `,
      img: '/img/tutorial/plane-agree.png',
      active: '.player.iam .card-worker',
      buttons: [{ text: 'Продолжай', step: 'help' }],
    },
    help: {
      pos: 'top-right',
      text: `
        Игра может помочь с размещением блоков, если нажать <a>Помочь выложить</a>. Если в руке остались блоки, то же самое произойдет при нажатии кнопки <a>Завершить раунд</a>.
      `,
      img: '/img/tutorial/plane-help.png',
      active: '.player.iam .card-worker',
      buttons: [{ text: 'Спасибо', action: 'exit' }],
    },
  },
});
