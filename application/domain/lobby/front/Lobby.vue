<template>
  <lobby :gameServerTitle="gameServerTitle">
    <template v-if="lobby.__gameServerConfig" #menu-item-game>
      <games class="menu-item-content" :deckMap="deckMap" :defaultDeckType="defaultDeckType" />
    </template>
  </lobby>
</template>

<script>
import Lobby from '~/lib/lobby/front/Lobby.vue';
import games from '~/lib/lobby/front/components/games.vue';

export default {
  name: 'ReleaseLobby',
  components: { Lobby, games },
  data() {
    return {};
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.state.store || {};
    },
    lobby() {
      return this.store.lobby?.[this.state.currentLobby] || {};
    },
    gameServerTitle() {
      return this.lobby.__gameServerConfig?.title;
    },
    defaultDeckType() {
      return this.lobby.__gameServerConfig?.code;
    },
    deckMap() {
      return {
        [this.defaultDeckType]: this.lobby.__gameServerConfig,
      };
    },
  },
  methods: {},
  created() {},
  mounted() {},
  async beforeDestroy() {},
};
</script>
<style lang="scss"></style>
