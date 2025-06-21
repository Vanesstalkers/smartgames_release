({
  steps: {
    planeControls: {
      initialStep: true,
      pos: 'bottom-left',
      text: `
        Кнопка центровки игрового поля может быть полезна, если вы случайно переместились за пределы экрана.
      `,
      active: '.gui-btn.move',
      buttons: [
        { text: 'Продолжай', step: 'planeControlsMouseLeft' }
      ],
    },
    planeControlsMouseLeft: {
      pos: 'bottom-left',
      text: `
        При зажатой левой кнопке мыши можно перемещать игровое поле.
      `,
      img: '/img/tutorial/mouse-left.png',
      actions: {
        before: ({ state: { isMobile } }) => {
          const skipStep = isMobile ? true : false;
          return { skipStep };
        },
      },
      buttons: [
        { text: 'Продолжай', step: 'planeControlsMouseRight' },
      ],
    },
    planeControlsMouseRight: {
      pos: 'bottom-left',
      text: `
        При зажатой правой кнопке мыши можно вращать игровое поле.
      `,
      img: '/img/tutorial/mouse-right.png',
      actions: {
        before: ({ state: { isMobile } }) => {
          const skipStep = isMobile ? true : false;
          return { skipStep };
        },
      },
      buttons: [
        { text: 'Продолжай', step: 'planeControlsMouseMiddle' },
      ],
    },
    planeControlsMouseMiddle: {
      pos: 'bottom-left',
      text: `
        Игровое поле можно перемешать.
      `,
      img: '/img/tutorial/touch-move.png',
      actions: {
        before: ({ state: { isMobile } }) => {
          const skipStep = isMobile ? false : true;
          return { skipStep };
        },
      },
      buttons: [
        { text: 'Продолжай', step: 'planeControlsTouchMove' },
      ],
    },
    planeControlsTouchMove: {
      pos: 'bottom-left',
      text: `
        Также можно менять его масштаб.
      `,
      img: '/img/tutorial/touch-scroll.png',
      actions: {
        before: ({ state: { isMobile } }) => {
          const skipStep = isMobile ? false : true;
          return { skipStep };
        },
      },
      buttons: [
        { text: 'Продолжай', step: 'planeControlsTouchScroll' },
      ],
    },
    planeControlsTouchScroll: {
      pos: 'bottom-left',
      text: `
        Колесиком мыши можно приближать и удалять игровое поле.
      `,
      img: '/img/tutorial/mouse-middle.png',
      actions: {
        before: ({ state: { isMobile } }) => {
          const skipStep = isMobile ? true : false;
          return { skipStep };
        },
      },
      buttons: [
        { text: 'Продолжай', step: 'logs' },
      ],
    },
    logs: {
      pos: 'bottom-left',
      text: `
        Это кнопка доступа к логам текущей игры.
      `,
      active: '.gui-btn.log',
      actions: {
        before: ({ $root }) => {
          const $log = $root.querySelector('.gui-btn.log');
          if (!$log.classList.contains('active')) $log.click();
        },
      },
      buttons: [
        { text: 'Продолжай', step: 'chat' },
      ],
    },
    chat: {
      pos: 'bottom-left',
      text: `
        Это кнопка доступа к чату игроков. В списке доступных каналов, помимо личных и общего чата, присутствует чат текущей игры.
      `,
      active: '.gui-btn.chat',
      actions: {
        before: ({ $root }) => {
          const $chat = $root.querySelector('.gui-btn.chat');
          if (!$chat.classList.contains('active')) $chat.click();
        },
        customExit: async ({ $root }) => {
          const $chat = $root.querySelector('.gui-btn.chat');
          if ($chat.classList.contains('active')) $chat.click();
          return { exit: true };
        },
      },
      buttons: [
        { text: 'Понятно, спасибо', action: 'customExit' },
      ],
    },
  },
});
