export default [
  {
    path: '/game/release/corporate/:id',
    name: 'Release Corporate Game',
    component: function () {
      return import('./corporateGame.vue');
    },
  },
  {
    path: '/game/release/:type/:id',
    name: 'Release Game',
    component: function () {
      return import('./Game.vue');
    },
  },
];
