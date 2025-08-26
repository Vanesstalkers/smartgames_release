export default {
  path: '/game/TO_CHANGE/:type/:id',
  name: 'TO_CHANGE Game',
  component: function () {
    return import('./Game.vue');
  },
};
