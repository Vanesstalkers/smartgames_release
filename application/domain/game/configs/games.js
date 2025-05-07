() => ({
  single: {
    ...{
      title: 'Фриланс',
      icon: ['fas', 'user'],
      style: { order: 1 },
    },
    items: {
      blitz: {
        title: 'Блиц',
        timer: 60,
        timerReleasePremium: 20,
        planesAtStart: 2,
        planesNeedToStart: 2,
        roundStartCardAddToPlayerHand: true,
        allowedAutoCardPlayRoundStart: false,
        style: { order: 1 },
      },
      standart: {
        title: 'Стандарт',
        timer: 45,
        timerReleasePremium: 15,
        roundStartCardAddToPlayerHand: false,
        allowedAutoCardPlayRoundStart: false,
        style: { order: 2 },
      },
      hardcore: {
        title: 'Хардкор',
        timer: 30,
        timerReleasePremium: 10,
        roundStartCardAddToPlayerHand: false,
        allowedAutoCardPlayRoundStart: true,
        style: { order: 3 },
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
      planesToChoose: 2, // блоков на выбор игроку для добавления на поле
      timeToPlaceStartPlane: 10, // время на размещение стартового блока
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: false,
      cardsToRemove: ['audit', 'coffee', 'weekend'],
      autoFinishAfterRoundsOverdue: 10,

      playerList: [
        {
          _code: 1,
          deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
        },
      ],
      deckList: [
        { type: 'plane' },
        { type: 'plane', subtype: 'hand', itemType: 'plane'},
        { type: 'domino', itemType: 'any' },
        { type: 'card', itemType: 'event' },
        { type: 'card', subtype: 'active', itemType: 'event', access: 'all' },
        { type: 'card', subtype: 'drop', itemType: 'event' },
      ],
    },
  },
  duel: {
    ...{
      title: 'Дуэль',
      icon: ['fas', 'user-group'],
      style: { order: 2 },
    },
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
        style: { order: 1 },
      },
      standart: {
        title: 'Стандарт',
        timer: 45,
        timerReleasePremium: 15,
        roundStartCardAddToPlayerHand: false,
        allowedAutoCardPlayRoundStart: false,
        style: { order: 2 },
      },
      hardcore: {
        title: 'Хардкор',
        timer: 30,
        timerReleasePremium: 10,
        roundStartCardAddToPlayerHand: false,
        allowedAutoCardPlayRoundStart: true,
        style: { order: 3 },
      },
    },
    itemsDefault: {
      timer: 60,
      timerReleasePremium: 15,
      playerHandStart: 3,
      playerHandLimit: 3,
      planesAtStart: 1, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      planesToChoose: 2, // блоков на выбор игроку для добавления на поле
      timeToPlaceStartPlane: 10, // время на размещение стартового блока
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: false,
      autoFinishAfterRoundsOverdue: 10,

      playerList: [{ _code: 1 }, { _code: 2 }].map((item) => ({
        ...item,
        deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
      })),
      deckList: [
        { type: 'plane' },
        { type: 'plane', subtype: 'hand', itemType: 'plane'},
        { type: 'domino', itemType: 'any' },
        { type: 'card', itemType: 'event' },
        { type: 'card', subtype: 'active', itemType: 'event', access: 'all' },
        { type: 'card', subtype: 'drop', itemType: 'event' },
      ],
    },
  },
  ffa: {
    ...{
      title: 'Каждый за себя',
      icon: ['fas', 'users'],
      style: { order: 3 },
    },
    items: {
      blitz: {
        title: 'Блиц',
        timer: 60,
        timerReleasePremium: 20,
        roundStartCardAddToPlayerHand: true,
        allowedAutoCardPlayRoundStart: false,
        style: { order: 1 },
      },
      standart: {
        title: 'Стандарт',
        timer: 45,
        timerReleasePremium: 15,
        roundStartCardAddToPlayerHand: false,
        allowedAutoCardPlayRoundStart: false,
        style: { order: 2 },
      },
      hardcore: {
        title: 'Хардкор',
        timer: 30,
        timerReleasePremium: 10,
        roundStartCardAddToPlayerHand: false,
        allowedAutoCardPlayRoundStart: true,
        style: { order: 3 },
      },
    },
    itemsDefault: {
      timer: 60,
      timerReleasePremium: 15,
      playerHandStart: 2,
      playerHandLimit: 2,
      planesAtStart: 0, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      planesToChoose: 2, // блоков на выбор игроку для добавления на поле
      timeToPlaceStartPlane: 10, // время на размещение стартового блока
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: false,
      autoFinishAfterRoundsOverdue: 10,

      playerList: [{ _code: 1 }, { _code: 2 }, { _code: 3 }].map((item) => ({
        ...item,
        deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
      })),
      deckList: [
        { type: 'plane' },
        { type: 'plane', subtype: 'hand', itemType: 'plane'},
        { type: 'domino', itemType: 'any' },
        { type: 'card', itemType: 'event' },
        { type: 'card', subtype: 'active', itemType: 'event', access: 'all' },
        { type: 'card', subtype: 'drop', itemType: 'event' },
      ],
    },
  },
  team: {
    ...{
      title: 'Команды',
      icon: ['fas', 'dice-four'],
      style: { order: 4 },
    },
    active: false,
    items: { standart: {} },
    itemsDefault: {
      playerList: [{ _code: 1 }, { _code: 2 }, { _code: 3 }, { _code: 4 }].map((item) => ({
        ...item,
        deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
      })),
    },
  },

  corporate: {
    ...{
      title: 'Потасовка',
      icon: ['fas', 'star'],
      style: { order: 5, width: '90%', textAlign: 'center' },
    },
    items: {
      cooperative: {
        title: 'Кооперация',
        skipStartPlanes: ['Plane[12]', 'Plane[15]', 'Plane[16]'],
        // roundStartCardAddToPlayerHand: false,
        // allowedAutoCardPlayRoundStart: true,
      },
      competition: {
        title: 'Соревнование',
        planesNeedToStart: 1,
        startPlanes: ['Plane[8]'],
        integrationPlanes: ['Plane[4]', 'Plane[5]', 'Plane[10]', 'Plane[11]'],
        // roundStartCardAddToPlayerHand: false,
        // allowedAutoCardPlayRoundStart: true,
      },
    },
    itemsDefault: {
      timer: 120,
      timerReleasePremium: 20,
      playerHandStart: 3,
      playerHandLimit: 3,
      planesAtStart: 3, // изначальное количество блоков на поле (для core-игры количество соответствует количеству игр)
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      planesToChoose: 2, // блоков на выбор игроку для добавления на поле
      timeToPlaceStartPlane: 10, // время на размещение стартового блока
      roundStartCardAddToPlayerHand: true,
      allowedAutoCardPlayRoundStart: false,
      autoFinishAfterRoundsOverdue: 10,

      playerCount: '2-8',
      maxPlayersInGame: '1-4',
      playerTemplates: {
        default: {
          deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
        },
      },

      playerList: [],
      deckList: [
        { type: 'plane' },
        { type: 'plane', subtype: 'hand', itemType: 'plane'},
        { type: 'domino', itemType: 'any' },
        { type: 'card', itemType: 'event' },
        { type: 'card', subtype: 'active', itemType: 'event', access: 'all' },
        { type: 'card', subtype: 'drop', itemType: 'event' },
      ],
    },
  },
});
