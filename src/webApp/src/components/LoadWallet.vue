<template>
  <div id="load-wallet">
    <div v-if="!(ethWallet && ethWallet.opened)" >
      <div>Enter private key:</div>
      <input :value="privateKey" @input="updatePrivateKey" :disabled="isValidPrivateKey">
    </div>
    <transition name="fade">
      <div v-if="ethWallet && !ethWallet.opened" >Open wallet ...</div>
    </transition>
    <transition name="fade">
      <div v-if="ethWallet && ethWallet.opened" >Wallet opened!</div>
    </transition>
  </div>
</template>

<script>

import EthWallet from '@/../../ethWallet';
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'LoadWallet',
  data: function () {
    return {
      privateKey: null,
      isValidPrivateKey: false
    };
  },
  computed: {
    ...mapGetters(['ethWallet'])
  },
  methods: {
    ...mapActions(['createWallet']),
    updatePrivateKey(e) {
      const privateKey = e.target.value;
      if (EthWallet.validatePrivateKey(privateKey)) {
        this.isValidPrivateKey = true;
        this.createWallet({ privateKey });
      }
    }

  }

};
</script>

<style scoped lang="scss">
  #load-wallet{
    input {
      width: 70%;
    }
  }
</style>
