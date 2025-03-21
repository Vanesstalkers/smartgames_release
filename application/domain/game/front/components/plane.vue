<template>
  <div v-if="plane._id || this.planeId === 'fake'" :id="plane._id" :class="[
    'plane',
    isSelectable ? 'selectable' : '',
    isOneOfMany ? 'one-of-many' : '',
    isExtraPlane ? 'extra' : '',
    isPlacementRequired ? 'placement-required' : '',
    game.merged ? 'source-game-merged' : '',
    ...plane.customClass,
    ...Object.values(customClass),
  ]" :style="customStyle" v-on:click.stop="(e) => (isSelectable ? choosePlane() : selectPlane(e))" :code="plane.code">
    <div class="price">{{ (plane.price * 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') }}₽</div>
    <div class="zone-wraper">
      <plane-zone v-for="id in zoneIds" :key="id" v-bind:zoneId="id" :linkLines="linkLines"
        :gameId="plane.anchorGameId" />
    </div>
    <div class="port-wraper">
      <plane-port v-for="id in portIds" :key="id" v-bind:portId="id" :linkLines="linkLines" />
    </div>
    <div v-if="!isCardPlane" div class="custom-bg">
      <span v-for="item in customBG(plane._id)" :key="item.code"
        :style="`background-position-x: ${item.x}; background-position-y: ${item.y}`" />
    </div>
    <svg v-if="!isCardPlane">
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
    plane() {
      return this.store.plane?.[this.planeId] || { eventData: {}, customClass: [] };
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
        if (this.planeId === 'fake' && this.inHand) {
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
.plane {
  position: relative;
  position: absolute;
  width: 500px;
  height: 250px;
  margin-bottom: 10px;
  transform-origin: 0 0;

  &.tutorial-active {
    z-index: -1 !important;
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

  &.one-of-many:after {
    box-shadow: inset 0 0 0px 10px blue;
  }

  &.extra {
    &:after {
      box-shadow: inset 0 0 0px 10px greenyellow;
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
}

.plane:not(.card-plane):after,
.plane:not(.card-plane):before {
  content: '';
  z-index: -1;
  position: absolute;
  left: 0px;
  top: 0px;
  width: 500px;
  height: 250px;
  border-radius: 20px;
  background: url(../assets/plane.png);
}

.plane:not(.card-plane):before {
  background: none;
  display: none;
}

.plane>.zone-wraper,
.plane>.port-wraper {
  z-index: 1;
  position: relative;
}

.plane .custom-bg {
  display: flex;
  flex-wrap: wrap;
  border-radius: 20px;
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
}

.plane .custom-bg>span {
  width: 80px;
  height: 80px;
  background-image: url(../assets/tiles.png);
  background-size: 1120px;
  background-repeat: no-repeat;
}

.plane.core .custom-bg {
  filter: grayscale(100%) brightness(200%) blur(2px);
}

.plane>svg {
  position: absolute;
  left: 0px;
  top: 0px;
  width: 500px;
  height: 250px;
  z-index: 0;
}

.plane.rotate90 {
  transform: rotate(90deg);
}

.plane.rotate180 {
  transform: rotate(180deg);
}

.plane.rotate270 {
  transform: rotate(270deg);
}

.plane.in-hand:not(.card-plane) {
  order: -1;
  transform: scale(0.5);
  transform-origin: center left;
  margin: 125px -250px -50px 0px;
}

.player:not(.am) .plane.in-hand:not(.card-plane) {
  transform-origin: center right;
  // margin: 125px -250px -50px 0px;
}

#game.mobile-view.portrait-view .plane.in-hand:not(.card-plane) {
  transform: scale(0.7);
  transform-origin: top right;
  margin: 25px 0px -75px 0px;
}

.plane.in-hand:hover {
  z-index: 2;
  opacity: 1;
  margin-bottom: 40px;
}

.plane.in-hand.card-plane {
  order: 0;
  z-index: 1;
  transform: scale(0.5);
  transform-origin: center left;
  margin: 210px -70px 0px 0px;

  >.price {
    font-size: 24px;
  }

  &:hover {
    margin-bottom: 40px;
  }
}

.plane.in-hand.add-block-action {
  &::before {
    content: '+';
    background: rgb(0 255 0 / 40%);
    display: block;
    z-index: 1;
    font-size: 100px;
    color: white;
    text-align: left;
    padding-left: 20px;
    width: 480px;
    height: 250px;
    line-height: 100px;
  }

  >.price {
    display: none !important;
  }
}

.plane.in-hand.add-block-action:hover {
  &::before {
    content: 'Добавить блок';
    font-size: 32px;
    line-height: 32px;
    padding-top: 20px;
    height: 230px;
  }
}

.plane>.price {
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
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}
</style>
