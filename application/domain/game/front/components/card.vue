<template>
  <card :cardId="cardId" :canPlay="canPlay" :customStyle="customStyle" />
</template>

<script>
import { inject } from 'vue';
import card from '~/lib/game/front/components/card.vue';

export default {
  name: 'release-card',
  components: {
    card,
  },
  props: {
    cardId: String,
    canPlay: Boolean,
    cardData: Object,
    cardGroup: String,
    imgExt: String,
    imgFullPath: String,
  },
  setup() {
    return inject('gameGlobals');
  },
  data() {
    return {};
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.getStore();
    },
    game() {
      return this.getGame(this.card.sourceGameId);
    },
    card() {
      if (this.cardData) {
        if (!this.cardData.eventData) this.cardData.eventData = {};
        return this.cardData;
      }
      const card = this.store.card?.[this.cardId];
      return card?._id ? card : { _id: this.cardId, eventData: {} };
    },
    customStyle() {
      const {
        state: { serverOrigin },
        card,
        game,
        cardGroup,
        imgFullPath,
        imgExt = 'jpg',
      } = this;

      const rootPath = `${serverOrigin}/img/cards/${game.templates.card}`;
      const { group, name } = card;

      const cardPath = [cardGroup || group, name || 'back-side'].filter((s) => s).join('/');
      const path = imgFullPath || `${rootPath}/${cardPath}.${imgExt}` || `empty-card.${imgExt}`;

      return {
        backgroundImage: `url(${path})`,
      };
    },
  },
  methods: {},
  mounted() {},
};
</script>

<style lang="scss"></style>
