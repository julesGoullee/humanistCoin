<template>
  <div id="home">
    <NodeConnect v-if="!nodeConnected" />
    <transition name="fade">
      <LoadWallet v-if="nodeConnected && !humanist" />
    </transition>
    <transition name="fade">
      <Wallet v-if="me && me.validate" />
    </transition>
    <transition name="fade">
      <Submission v-if="submission" />
    </transition>
  </div>
</template>

<script>

import { mapGetters } from 'vuex';

import NodeConnect from '@/components/NodeConnect.vue';
import LoadWallet from '@/components/LoadWallet.vue';
import Submission from '@/components/Submission.vue';
import Wallet from '@/components/Wallet.vue';

export default {
  name: 'home',
  computed: {
    ...mapGetters([
      'nodeConnected',
      'humanist',
      'me',
      'submission'
    ])
  },
  components: {
    NodeConnect,
    LoadWallet,
    Wallet,
    Submission
  }
};
</script>
