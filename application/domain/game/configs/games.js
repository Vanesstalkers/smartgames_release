() => ({
  single: {
    ...{ title: 'Фриланс', icon: ['fas', 'user'] },
    items: {
      blitz: {
        title: 'Блиц',
        timer: 60,
        timerReleasePremium: 20,
        planesAtStart: 2,
        planesNeedToStart: 2,
        roundStartCardAddToPlayerHand: true,
        allowedAutoCardPlayRoundStart: false,
      },
      standart: {
        title: 'Стандарт',
        timer: 45,
        timerReleasePremium: 15,
        roundStartCardAddToPlayerHand: false,
        allowedAutoCardPlayRoundStart: false,
      },
      hardcore: {
        title: 'Хардкор',
        timer: 30,
        timerReleasePremium: 10,
        roundStartCardAddToPlayerHand: false,
        allowedAutoCardPlayRoundStart: true,
      },
    },
    itemsDefault: {
      singlePlayer: true,
      timer: 60,
      timerReleasePremium: 15,
      playerHandStart: 3,
      playerHandLimit: 3,
      planesAtStart: 3, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      planesToChoosee: 2, // блоков на выбор игроку для добавления на поле
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: false,
      cardsToRemove: ['audit', 'coffee', 'weekend'],
      autoFinishAfterRoundsOverdue: 10,

      playerList: [
        {
          _code: 1,
          active: true,
          deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
        },
      ],
      deckList: [
        { type: 'plane' },
        { type: 'domino', itemType: 'any' },
        { type: 'card', itemType: 'event' },
        { type: 'card', subtype: 'active', itemType: 'event', access: 'all' },
        { type: 'card', subtype: 'drop', itemType: 'event' },
      ],
    },
  },
  duel: {
    ...{ title: 'Дуэль', icon: ['fas', 'user-group'] },
    items: {
      blitz: {
        title: 'Блиц',
        timer: 60,
        timerReleasePremium: 20,
        playerHandStart: 0,
        planesAtStart: 0, // изначальное количество блоков на поле
        planesNeedToStart: 2, // нужно для начала игры (будут добавляться игроками)
        roundStartCardAddToPlayerHand: true,
        allowedAutoCardPlayRoundStart: false,
      },
      standart: {
        title: 'Стандарт',
        timer: 45,
        timerReleasePremium: 15,
        roundStartCardAddToPlayerHand: false,
        allowedAutoCardPlayRoundStart: false,
      },
      hardcore: {
        title: 'Хардкор',
        timer: 30,
        timerReleasePremium: 10,
        roundStartCardAddToPlayerHand: false,
        allowedAutoCardPlayRoundStart: true,
      },
    },
    itemsDefault: {
      timer: 60,
      timerReleasePremium: 15,
      playerHandStart: 3,
      playerHandLimit: 3,
      planesAtStart: 1, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      planesToChoosee: 2, // блоков на выбор игроку для добавления на поле
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: false,
      cardsToRemove: [],
      autoFinishAfterRoundsOverdue: 10,

      playerList: [
        {
          _code: 1,
          active: true,
          deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
        },
        {
          _code: 2,
          deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
        },
      ],
      deckList: [
        { type: 'plane' },
        { type: 'domino', itemType: 'any' },
        { type: 'card', itemType: 'event' },
        { type: 'card', subtype: 'active', itemType: 'event', access: 'all' },
        { type: 'card', subtype: 'drop', itemType: 'event' },
      ],
    },
  },
  ffa: {
    ...{ title: 'Каждый за себя', icon: ['fas', 'users'] },
    items: {
      blitz: {
        title: 'Блиц',
        timer: 60,
        timerReleasePremium: 20,
        roundStartCardAddToPlayerHand: true,
        allowedAutoCardPlayRoundStart: false,
      },
      standart: {
        title: 'Стандарт',
        timer: 45,
        timerReleasePremium: 15,
        roundStartCardAddToPlayerHand: false,
        allowedAutoCardPlayRoundStart: false,
      },
      hardcore: {
        title: 'Хардкор',
        timer: 30,
        timerReleasePremium: 10,
        roundStartCardAddToPlayerHand: false,
        allowedAutoCardPlayRoundStart: true,
      },
    },
    itemsDefault: {
      timer: 60,
      timerReleasePremium: 15,
      playerHandStart: 2,
      playerHandLimit: 2,
      planesAtStart: 0, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      planesToChoosee: 2, // блоков на выбор игроку для добавления на поле
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: false,
      cardsToRemove: [],
      autoFinishAfterRoundsOverdue: 10,

      playerList: [
        {
          _code: 1,
          active: true,
          deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
        },
        {
          _code: 2,
          deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
        },
        {
          _code: 3,
          deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
        },
      ],
      deckList: [
        { type: 'plane' },
        { type: 'domino', itemType: 'any' },
        { type: 'card', itemType: 'event' },
        { type: 'card', subtype: 'active', itemType: 'event', access: 'all' },
        { type: 'card', subtype: 'drop', itemType: 'event' },
      ],
    },
  },
  team: {
    ...{ title: 'Команды', icon: ['fas', 'dice-four'] },
    active: false,
    items: { standart: {} },
    itemsDefault: {
      playerList: [{}, {}, {}, {}],
    },
  },
});
