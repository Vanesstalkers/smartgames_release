<template>
  <div
    v-if="port._id"
    :class="['port', selectable ? 'selectable' : '']"
    :id="port._id"
    :style="{ left: port.left + 'px', top: port.top + 'px', opacity: port.linkedBridgeCode ? 0 : 1 }"
    :x="port.left + 37.5"
    :y="port.top + 37.5"
    v-on:click.stop="(e) => (selectable ? choosePort() : null)"
  />
</template>

<script>
import { inject } from 'vue';

export default {
  props: {
    portId: String,
    linkLines: Object,
  },
  setup() {
    return inject('gameGlobals');
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.getStore();
    },
    game() {
      return this.getGame();
    },
    port() {
      return this.store.port?.[this.portId];
    },
    sessionPlayerGamePort() {
      return this.port.code.indexOf(this.game.code) === 0;
    },
    selectable() {
      return this.port.eventData.selectable && this.sessionPlayerIsActive() && this.sessionPlayerGamePort;
    },
  },
  methods: {
    async choosePort() {
      await this.handleGameApi({ name: 'eventTrigger', data: { eventData: { targetId: this.portId } } });
    },
    paintLinks() {
      const portEl = document.getElementById(this.port._id);
      for (const link of Object.keys(this.port.links)) {
        const linkEl = document.getElementById(link);
        if (portEl?.closest('.plane') && linkEl?.closest('.plane')) {
          const x1 = portEl.getAttribute('x');
          const y1 = portEl.getAttribute('y');
          const x2 = linkEl.getAttribute('x');
          const y2 = linkEl.getAttribute('y');
          const key = [[x1, y1].join('.'), [x2, y2].join('.')].sort().join('.');
          this.$set(this.linkLines, key, { x1, y1, x2, y2 });
        }
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.paintLinks();
    });
  },
};
</script>

<style lang="scss" scoped>
.port {
  position: absolute;
  height: 75px;
  width: 75px;
  --border: 1px solid yellow;
  background-image: url(@/assets/clear-black-back.png);
  background-size: 75px;
  background-position: center;
  background-repeat: no-repeat;
  background: black;
  opacity: 1;

  &:after {
    content: '';
    background-image: url(../assets/portIcon.png);
    width: 100%;
    height: 100%;
    background-size: 30px;
    background-position: center;
    background-repeat: no-repeat;
    display: block;
    opacity: 0.5;
  }
}

.plane.preview .port.selectable {
  box-shadow: none !important;
}

#game.debug {
  .port {
    opacity: 0.2 !important;
  }
}
</style>
