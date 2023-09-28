<template>
  <lobby :customInitSession="customInitSession" />
</template>

<script>
import Lobby from '~/lib/lobby/front/Lobby.vue';
export default {
  components: { Lobby },
  methods: {
    async customInitSession() {
      await this.$root.initSessionIframe();
    },
  },
  created() {},
  async beforeDestroy() {},
};
</script>
<style lang="scss">
#lobby {
  // чтобы не мельтешил при загрузке игры
  display: none !important;
}
</style>
