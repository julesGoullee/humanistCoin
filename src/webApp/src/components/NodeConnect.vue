<template>
  <div id="node-connect">
    <div v-if="!nodeConnected && !errorConnection" >Connect to node....</div>
    <transition name="fade">
      <div v-if="nodeConnected" >Node connected!</div>
    </transition>
    <transition name="fade">
      <div v-if="errorConnection" >{{ errorConnection }}</div>
    </transition>
  </div>
</template>

<script>

import { mapGetters, mapActions } from 'vuex';
import { displayError } from '@/../../utils/errors';

export default {
  name: 'NodeConnect',
  data() {
    return {
      errorConnection: false
    };
  },
  computed: {
    ...mapGetters(['nodeConnected'])
  },
  methods: {
    ...mapActions(['nodeConnect'])
  },
  mounted: async function () {
    if (!this.nodeConnected && !this.errorConnection) {
      await this.nodeConnect()
        .catch(error => this.errorConnection = displayError(error) );
    }
  }
};
</script>

<style scoped>

</style>
