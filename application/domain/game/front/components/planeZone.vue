<template>
  <div
    :style="{
      left: zone.left + 'px',
      top: zone.top + 'px',
      color: 'white',
      fontSize: '10px',
    }"
    :class="['zone', zone.vertical ? 'vertical' : '', zone.double ? 'double' : '', zone.available ? 'available' : '']"
    v-on:click="putDice"
    :code="zone.code"
    :_id="zone._id"
  >
    <div class="wraper">
      <plane-zone-sides
        :linkLines="linkLines"
        :sideList="zone.sideList"
        :position="{ left: zone.left, top: zone.top, vertical: zone.vertical }"
      />
      <dice v-for="id in Object.keys(zone.itemMap)" :key="id" :diceId="id" :zone="zone" :gameId="gameId" />
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';
import planeZoneSides from './planeZoneSides.vue';
import dice from './dice.vue';

export default {
  components: {
    planeZoneSides,
    dice,
  },
  props: {
    zoneId: String,
    linkLines: Object,
    gameId: String,
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
      return this.getGame(this.zone.sourceGameId);
    },
    zone() {
      return {
        ...(this.store.zone?.[this.zoneId] || {}),
        available: this.zoneAvailable(this.zoneId),
      };
    },
  },
  methods: {
    async putDice() {
      if (this.gameCustom.pickedDiceId) {
        await this.handleGameApi(
          {
            name: 'replaceDice',
            gameId: this.game._id,
            data: { diceId: this.gameCustom.pickedDiceId, zoneId: this.zoneId },
          },
          {
            onSuccess: (res) => {
              this.gameCustom.pickedDiceId = '';
              this.hideZonesAvailability();
            },
          }
        );
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.zone {
  position: absolute;
  height: 73px;
  width: 142px;
  border: 2px solid yellow;
  white-space: pre;
  background: url(@/assets/clear-black-back.png);
  background: black;

  &.tutorial-active {
    box-shadow: 0 0 10px 10px #f4e205;
  }
}

#game.debug {
  .zone {
    background: transparent;
  }
}

.zone.vertical {
  height: 142px;
  width: 73px;
}
.zone > .wraper {
  position: relative;
  height: 100%;
  width: 100%;
}
.zone > .wraper > .domino-dice {
  position: absolute;
  top: 0px;
  left: 0px;
}
.zone.available {
  box-shadow: inset 0 0 20px 8px lightgreen;
  cursor: pointer;
}
.zone.available.hard {
  box-shadow: inset 0 0 20px 8px yellow;
}
</style>
