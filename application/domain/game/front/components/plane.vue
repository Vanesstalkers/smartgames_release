<template>
  <div v-if="plane._id || fakeId" :id="plane._id" :class="[
    'plane',
    fakeId ? 'fake' : '',
    isSelectable ? 'selectable' : '',
    isOneOfMany ? 'one-of-many' : '',
    isExtraPlane ? 'extra' : '',
    isPlacementRequired ? 'placement-required' : '',
    game.merged && game.gameConfig === 'cooperative' ? 'source-game-merged' : '',
    plane.release ? 'release' : '',
    plane.anchorGameId === sessionPlayerGameId || plane.mergedGameId === sessionPlayerGameId ? 'anchor-team-field' : '',
    ...plane.customClass,
    ...Object.values(customClass),
  ]" :style="customStyle" v-on:click.stop="(e) => (isSelectable ? choosePlane() : selectPlane(e))" :code="plane.code"
    :anchorGameId="plane.anchorGameId">
    <div v-if="plane._id && !gameState.viewerMode" class="price">{{ (plane.price *
      1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') }}₽
    </div>
    <div v-if="plane._id" class="zone-wraper">
      <plane-zone v-for="id in zoneIds" :key="id" v-bind:zoneId="id" :linkLines="linkLines"
        :gameId="plane.anchorGameId" />
    </div>
    <div v-if="plane._id" class="port-wraper">
      <plane-port v-for="id in portIds" :key="id" v-bind:portId="id" :linkLines="linkLines" />
    </div>
    <div v-if="!isCardPlane" div class="custom-bg">
      <span v-for="item in customBG(plane._id)" :key="item.code"
        :style="`background-position-x: ${item.x}; background-position-y: ${item.y}`" />
    </div>
    <svg v-if="plane._id && !isCardPlane">
      <line v-for="[key, line] in Object.entries(linkLines)" :key="key" :x1="line.x1" :y1="line.y1" :x2="line.x2"
        :y2="line.y2" fill="none" stroke="yellow" stroke-width="10" />
    </svg>
  </div>
</template>

<script>
import { inject } from 'vue';
import planeZone from './planeZone.vue';
import planePort from './planePort.vue';

export default {
  name: 'plane',
  components: {
    planePort,
    planeZone,
  },
  data() {
    return { linkLines: {}, customClass: {} };
  },
  props: {
    planeId: String,
    inHand: Boolean,
    viewStyle: {
      required: false,
      type: Object,
      default() {
        return {};
      },
    },
    fake: Boolean,
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
      return this.getGame(this.plane.anchorGameId || this.plane.sourceGameId);
    },
    sessionPlayerGameId() {
      return this.sessionPlayer()?.gameId;
    },
    plane() {
      return this.store.plane?.[this.planeId] || { eventData: {}, customClass: [] };
    },
    fakeId() {
      return this.planeId.startsWith('fake');
    },
    customStyle() {
      const { game, plane, inHand, viewStyle, customClass, state: { serverOrigin } = {} } = this;
      const style = { ...plane, ...viewStyle } || {};
      if (style.left) style.left = parseInt(style.left) + 'px';
      if (style.top) style.top = parseInt(style.top) + 'px';
      if (style.width) style.width = parseInt(style.width) + 'px';
      if (style.height) style.height = parseInt(style.height) + 'px';

      if (!inHand) {
        // для style.rotation == 0 тоже нужно обновлять, иначе во view-режиме подтянется rotation из предыдущей позиции
        const rotateDegree = 90 * (style.rotation || 0);
        style.transform = `rotate(${rotateDegree}deg)`;
        this.customClass = { ...customClass, rotate: `rotate${rotateDegree}` };
      }

      if (this.isCardPlane) {
        const sourceGame = this.getGame(plane.sourceGameId);
        const rootPath = `${serverOrigin}/img/cards/${sourceGame.templates.card}`;
        const cardName = plane.code.includes('event_req_legal') ? 'req_legal' : 'req_tax';
        style.backgroundImage = `url(${rootPath}/${cardName}.jpg), url(empty-card.jpg)`;
      } else if (this.fakeId) {
        style.backgroundImage = `url(${serverOrigin}/img/planes/back-side.jpg)`;
      }
      return style;
    },
    isCardPlane() {
      return this.plane.customClass.includes('card-plane');
    },
    zoneIds() {
      return Object.keys(this.plane.zoneMap || {});
    },
    portIds() {
      return Object.keys(this.plane.portMap || {});
    },
    planeEventData() {
      return this.sessionPlayerIsActive() && this.sessionPlayer().eventData.plane?.[this.planeId];
    },
    isSelectable() {
      return this.planeEventData?.selectable;
    },
    isPlacementRequired() {
      return this.planeEventData?.mustBePlaced;
    },
    isExtraPlane() {
      return this.planeEventData?.extraPlane;
    },
    isOneOfMany() {
      return this.planeEventData?.oneOfMany;
    },
  },
  methods: {
    async selectPlane(event) {
      const $plane = event.target.closest('.plane');
      if ($plane.closest('.player.iam')) {
        this.gameCustom.selectedPlane = this.planeId;
        this.hidePreviewPlanes();
        if (this.fakeId && this.inHand) {
          await this.handleGameApi({ name: 'takePlane', data: {} });
        } else {
          await this.handleGameApi({ name: 'showPlanePortsAvailability', data: { joinPlaneId: this.planeId } });
        }
      }
    },
    async choosePlane() {
      this.hidePreviewPlanes();
      await this.handleGameApi({ name: 'eventTrigger', data: { eventData: { targetId: this.planeId } } });
    },
    customBG(pid) {
      let storageFillData = localStorage.getItem('gamePlaneBackgroundData');
      if (storageFillData)
        try {
          storageFillData = JSON.parse(storageFillData);
          storageFillData = storageFillData[this.gameState.gameId];
        } catch (e) {
          storageFillData = null;
        }
      if (!storageFillData) storageFillData = {};
      let fillData = storageFillData[pid];

      if (fillData) return fillData;

      fillData = [];

      for (let i = 0; i < 18; i++) {
        fillData[i] = {
          x: -80 * Math.floor(14 * Math.random()) + 'px',
          y: -80 * Math.floor(6 * Math.random()) + 'px',
        };
      }
      storageFillData[pid] = fillData;

      // this.gameState.gameId - защита от переполнения локального хранилища (фактически будет сбрасываться каждую новую игру)
      localStorage.setItem('gamePlaneBackgroundData', JSON.stringify({ [this.gameState.gameId]: storageFillData }));

      return fillData;
    },
  },
  mounted() {
    // $nextTick не всегда помогает при запуске новой игры
    setTimeout(() => {
      this.state.gamePlaneNeedUpdate = true; // выставит правильный zoom
    }, 100);
  },
};
</script>

<style lang="scss" scoped>
#game {
  &.debug {
    .plane {
      &:before {
        content: attr(anchorGameId) !important;
        display: block !important;
        color: white;
        font-size: 24px;
        position: absolute;
        z-index: -1;
        top: -30px;
        left: 0px;
      }
    }
  }
}

.plane {
  $width: 500px;
  $height: 250px;
  $border-radius: 20px;

  position: relative;
  position: absolute;
  width: $width;
  height: $height;
  margin-bottom: 10px;
  transform-origin: 0 0;
  background-size: contain;

  &:not(.card-plane) {

    &:after,
    &:before {
      content: '';
      z-index: -1;
      position: absolute;
      left: 0px;
      top: 0px;
      width: $width;
      height: $height;
      border-radius: $border-radius;
      background: url(../assets/plane.png);
    }

    &:before {
      background: none;
      display: none;
    }

    &.fake:after {
      display: none;
    }
  }

  &.release {
    &:after {
      box-shadow: inset 0 0 0px 10px green;
    }
  }

  &.tutorial-active {
    z-index: 1 !important;
    box-shadow: 0 0 10px 10px #f4e205 !important;
  }

  &.selectable {
    &:not(.card-plane) {
      box-shadow: none !important;
    }

    &:after {
      box-shadow: inset 0 0 0px 10px yellow;
    }
  }

  &.extra {
    &:after {
      box-shadow: inset 0 0 0px 10px greenyellow;
    }
  }

  &.one-of-many {
    &:after {
      box-shadow: inset 0 0 0px 10px blue;
    }
  }

  &.placement-required {
    &:after {
      box-shadow: inset 0 0 0px 10px orange;
    }

    &.card-plane {
      box-shadow: inset 0 0 20px 8px orange !important;
    }
  }

  >.zone-wraper,
  >.port-wraper {
    z-index: 1;
    position: relative;
  }

  .custom-bg {
    display: flex;
    flex-wrap: wrap;
    border-radius: $border-radius;
    overflow: hidden;
    position: absolute;
    left: 10px;
    top: 5px;
    width: 480px;
    height: 240px;
    z-index: 0;
    filter: blur(2px);
    --filter: grayscale(75%);
    --filter: grayscale(100%) brightness(200%) blur(2px);

    >span {
      width: 80px;
      height: 80px;
      background-image: url(../assets/tiles.png);
      background-size: 1120px;
      background-repeat: no-repeat;
    }
  }

  &.core {
    .custom-bg {
      filter: grayscale(100%) brightness(200%) blur(2px);
    }
  }

  >svg {
    position: absolute;
    left: 0px;
    top: 0px;
    width: $width;
    height: $height;
    z-index: 0;
  }

  &.rotate90 {
    transform: rotate(90deg);
  }

  &.rotate180 {
    transform: rotate(180deg);
  }

  &.rotate270 {
    transform: rotate(270deg);
  }

  >.price {
    display: none;
    color: gold;
    font-size: 54px;
    position: absolute;
    z-index: 2;
    top: 0px;
    left: 0px;
    background: #00000090;
    width: 100%;
    padding: 10px 0px;
    border-top-left-radius: $border-radius;
    border-top-right-radius: $border-radius;
  }
}
</style>
