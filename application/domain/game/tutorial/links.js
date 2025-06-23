({
  steps: {
    handDices: {
      pos: 'top-right',
      text: `
        Это твои костяшки в руке. <a>Выбери любую, чтобы увидеть какие зоны для ее размещения доступны</a>.
      `,
      active: '.player.iam .hand-dices .domino-dice',
      buttons: [
        { text: 'Спасибо', action: 'exit' },
      ],
    },
    handCards: {
      pos: 'top-right',
      text: `
        Это твои карты-события. Активируй их, нажимая на кнопку <a>Разыграть</a>.
      `,
      active: '.player.iam .hand-cards-list .card-event',
      buttons: [
        { text: 'Спасибо', action: 'exit' },
      ],
    },
    fieldZoneDouble: {
      text: `
        Обрати внимание что линии, связывавающие зоны, указывают какие стороны размещенных костяшек должны соответствовать друг другу. <a>У зоны дубля обе стороны костяшки должны быть одинаковыми</a>.
      `,
      img: '/img/tutorial/zone-double.png',
      active: { selector: '#game .plane .zone.double', css: { boxShadow: 'inset 0 0 20px 10px #f4e205' } },
      buttons: [
        { text: 'Спасибо', action: 'exit' }
      ],
    },
    cardActive: {
      text: `
        Это карты-событий, которые доступных для розыгрыша или уже были разыграны в текущем раунде.
      `,
      active: '[code="Deck[card_active]"] .card-event',
      buttons: [
        { text: 'Спасибо', action: 'exit' },
      ],
    },
    leaveGame: {
      pos: 'top-right',
      text: `
        Для выхода из игры необходимо нажать эту кнопку, либо выбрать соответствующий пункт в меню.
      `,
      active: '.leave-game-btn',
      buttons: [
        { text: 'Спасибо', action: 'exit' },
      ],
    },
    addExtraBlock: {
      pos: 'top-right',
      text: `
        Это дополнительный блок, который поможет разместить обязательные блоки на поле. <a>Дополнительных блоков можно взять несколько, а разместить только один</a>.
      `,
      active: '.add-block-action',
      buttons: [
        { text: 'Спасибо', action: 'exit' },
      ],
    }
  },
});
