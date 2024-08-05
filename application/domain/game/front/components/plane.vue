<template>
  <div
    v-if="plane._id || this.planeId === 'fake'"
    :id="plane._id"
    :class="[
      'plane',
      selectable ? 'selectable' : '',
      plane.eventData.moveToHand ? 'move-to-hand' : '',
      ...plane.customClass,
      ...Object.values(customClass),
    ]"
    :style="customStyle"
    v-on:click.stop="(e) => (selectable ? choosePlane() : selectPlane(e))"
    :code="plane.code"
  >
    <div class="price">{{ (plane.price * 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') }}₽</div>
    <div class="zone-wraper">
      <plane-zone v-for="id in zoneIds" :key="id" v-bind:zoneId="id" :linkLines="linkLines" />
    </div>
    <div class="port-wraper">
      <plane-port v-for="id in portIds" :key="id" v-bind:portId="id" :linkLines="linkLines" />
    </div>
    <div v-if="!cardPlane" div class="custom-bg">
      <span
        v-for="item in customBG(plane._id)"
        :key="item.code"
        :style="`background-position-x: ${item.x}; background-position-y: ${item.y}`"
      />
    </div>
    <svg>
      <line
        v-for="[key, line] in Object.entries(linkLines)"
        :key="key"
        :x1="line.x1"
        :y1="line.y1"
        :x2="line.x2"
        :y2="line.y2"
        fill="none"
        stroke="yellow"
        stroke-width="10"
      />
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
    return { linkLines: {}, customClass: {}, inHandStyle: {} };
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
    plane() {
      return this.store.plane?.[this.planeId] || { eventData: {}, customClass: [] };
    },
    customStyle() {
      const style = { ...this.plane, ...(this.inHand ? this.inHandStyle : {}), ...this.viewStyle } || {};
      if (style.left) style.left = parseInt(style.left) + 'px';
      if (style.top) style.top = parseInt(style.top) + 'px';
      if (style.width) style.width = parseInt(style.width) + 'px';
      if (style.height) style.height = parseInt(style.height) + 'px';

      if (!this.inHand) {
        // для style.rotation == 0 тоже нужно обновлять, иначе во view-режиме подтянется rotation из предыдущей позиции
        const rotateDegree = 90 * (style.rotation || 0);
        style.transform = `rotate(${rotateDegree}deg)`;
        this.customClass = { ...this.customClass, rotate: `rotate${rotateDegree}` };
      }

      if (this.plane.customClass.includes('card-event_req_legal'))
        style.backgroundImage = `url(${this.state.serverOrigin}/img/cards/req_legal.jpg), url(empty-card.jpg)`;
      if (this.plane.customClass.includes('card-event_req_tax'))
        style.backgroundImage = `url(${this.state.serverOrigin}/img/cards/req_tax.jpg), url(empty-card.jpg)`;

      return style;
    },
    cardPlane() {
      return this.plane.customClass.includes('card-plane');
    },
    zoneIds() {
      return Object.keys(this.plane.zoneMap || {});
    },
    portIds() {
      return Object.keys(this.plane.portMap || {});
    },
    selectable() {
      return this.sessionPlayerIsActive() && this.plane.eventData.selectable;
    },
  },
  methods: {
    async selectPlane(event) {
      const $plane = event.target.closest('.plane');
      if ($plane.closest('.player.iam')) {
        await this.handleGameApi({ name: 'showPlanePortsAvailability', data: { joinPlaneId: this.planeId } });
      }
    },
    async choosePlane() {
      await this.handleGameApi({ name: 'eventTrigger', data: { eventData: { targetId: this.planeId } } });
    },
    customBG(pid) {
      let storageFillData = localStorage.getItem('gamePlaneBackgroundData');
      if (storageFillData)
        try {
          storageFillData = JSON.parse(storageFillData);
        } catch (e) {}
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
      localStorage.setItem('gamePlaneBackgroundData', JSON.stringify(storageFillData));

      return fillData;
    },
  },
  mounted() {
    // $nextTick не всегда помогает при запуске новой игры
    setTimeout(() => {
      if (this.inHand) {
        this.customClass = { ...this.customClass, inHand: `in-hand` };
      } else {
        this.inHandStyle = {};
      }

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
  &.selectable:not(.card-plane) {
    box-shadow: none !important;
  }
  &.selectable:after {
    box-shadow: inset 0 0 0px 10px yellow;
  }
  &.selectable.move-to-hand:after {
    box-shadow: inset 0 0 0px 10px orange;
  }
  &.selectable.card-plane.move-to-hand {
    box-shadow: inset 0 0 20px 8px orange !important;
  }
}

.plane:not(.card-plane):after {
  content: '';
  z-index: -1;
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  background: url(../assets/plane.png);
}
.plane > .zone-wraper,
.plane > .port-wraper {
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
.plane .custom-bg > span {
  width: 80px;
  height: 80px;
  background-image: url(../assets/tiles.png);
  background-size: 1120px;
  background-repeat: no-repeat;
}
.plane.core .custom-bg {
  filter: grayscale(100%) brightness(200%) blur(2px);
}

.plane > svg {
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
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
  transform: scale(0.5);
  transform-origin: center left;
  margin: 125px -250px 0px 0px;
}
#game.mobile-view.portrait-view .plane.in-hand:not(.card-plane) {
  transform: scale(0.7);
  transform-origin: top right;
  margin: 25px 0px -75px 0px;
}

.plane.in-hand.card-plane {
  transform: scale(0.8);
  transform-origin: center left;
  margin: 125px -24px 0px 0px;

  > .price {
    font-size: 24px;
  }
}

.plane > .price {
  display: none;
  color: gold;
  font-size: 54px;
  position: absolute;
  z-index: 2;
  top: 0px;
  left: 0px;
  background: #00000090;
  padding: 8px 20px;
  border-top-left-radius: 20px;
}
</style>
