() => [
  {
    _code: 1,
    price: 250,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[1]': {
        'ZoneSide[1]': ['Zone[2].ZoneSide[1]'],
        'ZoneSide[2]': ['Zone[4].ZoneSide[1]'],
      },
      'Zone[3]': {
        'ZoneSide[1]': ['Zone[2].ZoneSide[2]'],
        'ZoneSide[2]': ['Zone[4].ZoneSide[2]'],
      },
    },
    zoneList: [
      { _code: 1, left: 130, top: 7, itemType: 'any', s: 'bash' },
      {
        _code: 2,
        left: 130,
        top: 100,
        vertical: 1,
        itemType: 'any',
        s: 'db',
      },
      { _code: 3, left: 230, top: 170, itemType: 'any', s: 'db' },
      {
        _code: 4,
        left: 300,
        top: 7,
        vertical: 1,
        itemType: 'any',
        s: 'core',
      },
    ],
    portList: [
      {
        _code: 1,
        left: 25,
        top: 100,
        direct: { left: true },
        links: ['Zone[2].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 400,
        top: 76,
        direct: { right: true },
        links: ['Zone[4].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
  {
    _code: 2,
    price: 180,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[1]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': ['Zone[2].ZoneSide[1]', 'Zone[2].ZoneSide[2]'],
      },
      'Zone[3]': {
        'ZoneSide[1]': ['Zone[2].ZoneSide[1]', 'Zone[2].ZoneSide[2]'],
        'ZoneSide[2]': [],
      },
    },
    zoneList: [
      { _code: 1, left: 50, top: 87, itemType: 'any' },
      {
        _code: 2,
        left: 215,
        top: 50,
        vertical: 1,
        double: true,
        itemType: 'any',
      },
      { _code: 3, left: 310, top: 87, itemType: 'any' },
    ],
    portList: [
      {
        _code: 1,
        left: 25,
        top: 5,
        direct: { top: true, left: false },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 400,
        top: 5,
        direct: { top: false, right: true },
        // direct: { top: true, right: false },
        links: ['Zone[3].ZoneSide[2]'],
        t: 'any',
      },
      {
        _code: 3,
        left: 25,
        top: 170,
        //direct: { bottom: true, left: false },
        direct: { bottom: false, left: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 4,
        left: 400,
        top: 170,
        direct: { bottom: true, right: false },
        links: ['Zone[3].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
  {
    _code: 3,
    price: 160,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[2]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': ['Zone[1].ZoneSide[2]', 'Zone[3].ZoneSide[1]'],
      },
    },
    zoneList: [
      { _code: 1, left: 50, top: 170, itemType: 'any', s: 'css' },
      {
        _code: 2,
        left: 215,
        top: 100,
        vertical: 1,
        itemType: 'any',
        s: 'html',
      },
      { _code: 3, left: 310, top: 170, itemType: 'any', s: 'js' },
    ],
    portList: [
      {
        _code: 1,
        left: 25,
        top: 70,
        direct: { left: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
      },
      {
        _code: 2,
        left: 215,
        top: 5,
        direct: { top: true },
        links: ['Zone[2].ZoneSide[1]'],
        t: 'any',
      },
      {
        _code: 3,
        left: 400,
        top: 70,
        direct: { right: true },
        links: ['Zone[3].ZoneSide[2]'],
        t: 'any',
      },
    ],
  },
  {
    _code: 4,
    price: 120,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[1]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': ['Zone[2].ZoneSide[1]'],
      },
      'Zone[2]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': [],
      },
    },
    zoneList: [
      { _code: 1, left: 80, top: 87, itemType: 'any' },
      { _code: 2, left: 280, top: 87, double: true, itemType: 'any' },
    ],
    portList: [
      {
        _code: 1,
        left: 80,
        top: 0,
        direct: { top: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 320,
        top: 0,
        direct: { top: true },
        links: ['Zone[2].ZoneSide[1]', 'Zone[2].ZoneSide[2]'],
        t: 'any',
      },
      {
        _code: 3,
        left: 80,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 4,
        left: 320,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[2].ZoneSide[1]', 'Zone[2].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
  {
    _code: 5,
    price: 100,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[1]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': ['Zone[2].ZoneSide[1]'],
      },
      'Zone[2]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': [],
      },
    },
    zoneList: [
      { _code: 1, left: 80, top: 87, itemType: 'any' },
      { _code: 2, left: 280, top: 87, itemType: 'any' },
    ],
    portList: [
      {
        _code: 1,
        left: 150,
        top: 0,
        direct: { top: true },
        links: ['Zone[1].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 350,
        top: 0,
        direct: { top: true },
        links: ['Zone[2].ZoneSide[2]'],
        t: 'any',
      },
      {
        _code: 3,
        left: 80,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 4,
        left: 280,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[2].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
  {
    _code: 6,
    price: 150,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[1]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': [],
        //'ZoneSide[2]': ['Zone[2].ZoneSide[1]'],
      },
      'Zone[2]': {
        'ZoneSide[1]': ['Zone[1].ZoneSide[2]'],
        'ZoneSide[2]': ['Zone[3].ZoneSide[1]'],
      },
      'Zone[3]': {
        //'ZoneSide[1]': ['Zone[2].ZoneSide[2]'],
        'ZoneSide[1]': [],
        'ZoneSide[2]': [],
      },
    },
    zoneList: [
      { _code: 1, left: 50, top: 50, itemType: 'any' },
      {
        _code: 2,
        left: 215,
        top: 50,
        vertical: 1,
        itemType: 'any',
      },
      { _code: 3, left: 310, top: 120, itemType: 'any' },
    ],
    portList: [
      {
        _code: 1,
        left: 0,
        top: 140,
        direct: { left: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 425,
        top: 30,
        direct: { right: true },
        links: ['Zone[3].ZoneSide[2]'],
        t: 'any',
      },
    ],
  },
  {
    _code: 7,
    price: 220,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[2]': {
        'ZoneSide[1]': ['Zone[4].ZoneSide[1]', 'Zone[4].ZoneSide[2]'],
        'ZoneSide[2]': ['Zone[1].ZoneSide[2]', 'Zone[3].ZoneSide[1]'],
      },
    },
    zoneList: [
      { _code: 1, left: 50, top: 170, itemType: 'any', s: 'css' },
      {
        _code: 2,
        left: 215,
        top: 100,
        vertical: 1,
        itemType: 'any',
        s: 'html',
      },
      { _code: 3, left: 310, top: 170, itemType: 'any', s: 'js' },
      {
        _code: 4,
        left: 180,
        top: 10,
        double: true,
        itemType: 'any',
        s: 'js',
      },
    ],
    portList: [
      {
        _code: 1,
        left: 0,
        top: 70,
        direct: { left: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
      },
      {
        _code: 3,
        left: 425,
        top: 70,
        direct: { right: true },
        links: ['Zone[3].ZoneSide[2]'],
        t: 'any',
      },
    ],
  },
  {
    _code: 8,
    price: 250,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[1]': {
        'ZoneSide[1]': ['Zone[4].ZoneSide[1]'],
        'ZoneSide[2]': ['Zone[2].ZoneSide[1]'],
      },
      'Zone[3]': {
        'ZoneSide[1]': ['Zone[4].ZoneSide[2]'],
        'ZoneSide[2]': ['Zone[2].ZoneSide[2]'],
      },
    },
    zoneList: [
      {
        _code: 1,
        left: 130,
        top: 7,
        vertical: 1,
        itemType: 'any',
        s: 'db',
      },
      { _code: 2, left: 130, top: 170, itemType: 'any', s: 'bash' },
      {
        _code: 3,
        left: 300,
        top: 100,
        vertical: 1,
        itemType: 'any',
        s: 'core',
      },
      { _code: 4, left: 230, top: 7, itemType: 'any', s: 'db' },
    ],
    portList: [
      {
        _code: 1,
        left: 0,
        top: 0,
        direct: { top: true, left: false },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 425,
        top: 0,
        direct: { top: true, right: false },
        links: ['Zone[4].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 3,
        left: 0,
        top: 175,
        direct: { bottom: true, left: false },
        links: ['Zone[2].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 4,
        left: 425,
        top: 175,
        direct: { bottom: true, right: false },
        links: ['Zone[3].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
  {
    _code: 9,
    price: 250,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[2]': {
        'ZoneSide[1]': ['Zone[1].ZoneSide[1]', 'Zone[1].ZoneSide[2]'],
        'ZoneSide[2]': ['Zone[3].ZoneSide[1]'],
      },
      'Zone[3]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': ['Zone[4].ZoneSide[1]', 'Zone[4].ZoneSide[2]'],
      },
    },
    zoneList: [
      {
        _code: 1,
        left: 30,
        top: 7,
        vertical: 1,
        double: true,
        itemType: 'any',
        s: 'db',
      },
      { _code: 2, left: 130, top: 40, itemType: 'any', s: 'bash' },
      { _code: 3, left: 230, top: 130, itemType: 'any', s: 'db' },
      {
        _code: 4,
        left: 400,
        top: 100,
        vertical: 1,
        double: true,
        itemType: 'any',
        s: 'core',
      },
    ],
    portList: [
      {
        _code: 1,
        left: 0,
        top: 175,
        direct: { bottom: true, left: false },
        links: ['Zone[1].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 425,
        top: 0,
        direct: { top: true, right: false },
        links: ['Zone[4].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
  {
    _code: 10,
    price: 100,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[1]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': ['Zone[2].ZoneSide[1]'],
      },
      'Zone[2]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': [],
      },
    },
    zoneList: [
      { _code: 1, left: 80, top: 87, itemType: 'any' },
      { _code: 2, left: 280, top: 87, itemType: 'any' },
    ],
    portList: [
      {
        _code: 1,
        left: 80,
        top: 0,
        direct: { top: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 350,
        top: 0,
        direct: { top: true },
        links: ['Zone[2].ZoneSide[2]'],
        t: 'any',
      },
      {
        _code: 3,
        left: 80,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 4,
        left: 350,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[2].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
  {
    _code: 11,
    price: 120,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[1]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': ['Zone[2].ZoneSide[1]'],
      },
      'Zone[2]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': [],
      },
    },
    zoneList: [
      { _code: 1, left: 80, top: 87, double: true, itemType: 'any' },
      { _code: 2, left: 280, top: 87, itemType: 'any' },
    ],
    portList: [
      {
        _code: 1,
        left: 120,
        top: 0,
        direct: { top: true },
        links: ['Zone[1].ZoneSide[1]', 'Zone[1].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 350,
        top: 0,
        direct: { top: true },
        links: ['Zone[2].ZoneSide[2]'],
        t: 'any',
      },
      {
        _code: 3,
        left: 120,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[1].ZoneSide[1]', 'Zone[1].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 4,
        left: 280,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[2].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
  {
    _code: 12,
    price: 180,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[1]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': ['Zone[2].ZoneSide[1]'],
      },
      'Zone[2]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': [],
      },
      'Zone[3]': {
        'ZoneSide[1]': ['Zone[1].ZoneSide[2]'],
        'ZoneSide[2]': ['Zone[2].ZoneSide[1]'],
      },
    },
    zoneList: [
      { _code: 1, left: 80, top: 87, itemType: 'any' },
      { _code: 2, left: 280, top: 87, itemType: 'any' },
      { _code: 3, left: 180, top: 5, double: true, itemType: 'any' },
    ],
    portList: [
      {
        _code: 1,
        left: 80,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 350,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[2].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
  {
    _code: 13,
    price: 180,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[2]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': ['Zone[1].ZoneSide[1]', 'Zone[3].ZoneSide[1]'],
      },
    },
    zoneList: [
      { _code: 1, left: 105, top: 90, vertical: 1, itemType: 'any' },
      { _code: 2, left: 215, top: 10, vertical: 1, itemType: 'any' },
      { _code: 3, left: 320, top: 90, vertical: 1, itemType: 'any' },
    ],
    portList: [
      {
        _code: 1,
        left: 75,
        top: 0,
        direct: { top: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 350,
        top: 0,
        direct: { top: true },
        links: ['Zone[3].ZoneSide[1]'],
        t: 'any',
      },
      {
        _code: 3,
        left: 0,
        top: 175,
        direct: { bottom: false, left: true },
        links: ['Zone[1].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 4,
        left: 425,
        top: 175,
        direct: { bottom: true, right: false },
        links: ['Zone[3].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
  {
    _code: 14,
    price: 170,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[2]': {
        'ZoneSide[1]': ['Zone[1].ZoneSide[2]'],
        'ZoneSide[2]': ['Zone[3].ZoneSide[1]'],
      },
    },
    zoneList: [
      { _code: 1, left: 80, top: 10, vertical: 1, itemType: 'any' },
      { _code: 2, left: 180, top: 87, double: true, itemType: 'any' },
      { _code: 3, left: 350, top: 90, vertical: 1, itemType: 'any' },
    ],
    portList: [
      {
        _code: 1,
        left: 215,
        top: 0,
        direct: { top: true },
        links: ['Zone[2].ZoneSide[1]', 'Zone[2].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 350,
        top: 0,
        direct: { top: true },
        links: ['Zone[3].ZoneSide[1]'],
        t: 'any',
      },
      {
        _code: 3,
        left: 80,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[1].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 4,
        left: 215,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[2].ZoneSide[1]', 'Zone[2].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
  {
    _code: 15,
    price: 170,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[2]': {
        'ZoneSide[1]': ['Zone[1].ZoneSide[1]'],
        'ZoneSide[2]': ['Zone[3].ZoneSide[1]'],
      },
    },
    zoneList: [
      { _code: 1, left: 80, top: 90, vertical: 1, itemType: 'any' },
      { _code: 2, left: 180, top: 87, double: true, itemType: 'any' },
      { _code: 3, left: 350, top: 90, vertical: 1, itemType: 'any' },
    ],
    portList: [
      {
        _code: 1,
        left: 80,
        top: 0,
        direct: { top: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 215,
        top: 0,
        direct: { top: true },
        links: ['Zone[2].ZoneSide[1]', 'Zone[2].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 3,
        left: 350,
        top: 0,
        direct: { top: true },
        links: ['Zone[3].ZoneSide[1]'],
        t: 'any',
      },
    ],
  },
  {
    _code: 16,
    price: 230,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[2]': {
        'ZoneSide[1]': ['Zone[1].ZoneSide[2]', 'Zone[4].ZoneSide[2]'],
        'ZoneSide[2]': ['Zone[3].ZoneSide[2]', 'Zone[4].ZoneSide[2]'],
      },
    },
    zoneList: [
      { _code: 1, left: 80, top: 90, vertical: 1, itemType: 'any' },
      { _code: 2, left: 180, top: 160, double: true, itemType: 'any' },
      { _code: 3, left: 350, top: 90, vertical: 1, itemType: 'any' },
      { _code: 4, left: 215, top: 10, vertical: 1, itemType: 'any' },
    ],
    portList: [
      {
        _code: 1,
        left: 80,
        top: 0,
        direct: { top: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 350,
        top: 0,
        direct: { top: true },
        links: ['Zone[3].ZoneSide[1]'],
        t: 'any',
      },
    ],
  },
  {
    _code: 17,
    price: 200,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[2]': {
        'ZoneSide[1]': ['Zone[1].ZoneSide[2]'],
        'ZoneSide[2]': ['Zone[3].ZoneSide[1]'],
      },
      'Zone[3]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': ['Zone[4].ZoneSide[2]'],
      },
    },
    zoneList: [
      {
        _code: 1,
        left: 50,
        top: 7,
        vertical: 1,
        double: true,
        itemType: 'any',
        s: 'db',
      },
      { _code: 2, left: 50, top: 170, itemType: 'any', s: 'bash' },
      { _code: 3, left: 230, top: 170, itemType: 'any', s: 'db' },
      {
        _code: 4,
        left: 300,
        top: 7,
        vertical: 1,
        double: true,
        itemType: 'any',
        s: 'core',
      },
    ],
    portList: [
      {
        _code: 1,
        left: 175,
        top: 0,
        direct: { top: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 425,
        top: 0,
        direct: { top: true, right: false },
        links: ['Zone[4].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 3,
        left: 425,
        top: 175,
        direct: { bottom: true, right: false },
        links: ['Zone[3].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
  {
    _code: 18,
    price: 230,
    width: 500,
    height: 250,
    zoneLinks: {
      'Zone[2]': {
        'ZoneSide[1]': [],
        'ZoneSide[2]': ['Zone[1].ZoneSide[1]', 'Zone[3].ZoneSide[1]'],
      },
      'Zone[3]': {
        'ZoneSide[1]': ['Zone[4].ZoneSide[2]'],
        'ZoneSide[2]': [],
      },
    },
    zoneList: [
      { _code: 1, left: 50, top: 90, vertical: 1, itemType: 'any' },
      { _code: 2, left: 160, top: 10, vertical: 1, itemType: 'any' },
      { _code: 3, left: 270, top: 90, vertical: 1, itemType: 'any' },
      { _code: 4, left: 380, top: 10, vertical: 1, itemType: 'any' },
    ],
    portList: [
      {
        _code: 1,
        left: 50,
        top: 0,
        direct: { top: true },
        links: ['Zone[1].ZoneSide[1]'],
        t: 'any',
        s: 'core',
      },
      {
        _code: 2,
        left: 380,
        top: 175,
        direct: { bottom: true },
        links: ['Zone[4].ZoneSide[2]'],
        t: 'any',
        s: 'core',
      },
    ],
  },
];