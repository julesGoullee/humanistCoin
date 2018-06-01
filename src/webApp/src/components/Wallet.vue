<template>
  <div id="wallet">
    <div>Address: {{ethWallet.data.address}}</div>
    <div>Birthday: {{ me.birthday | formatDate }}</div>
    <div>Hash: {{me.hash}}</div>
    <div>Created at: {{me.createdAt | formatDate}}</div>
    <div>Validate: {{me.validate}}</div>
    <div v-if="balance">Balance: <span id="balance-value">{{balance}}</span></div>
    <div>
      <br/>
      <div>Transactions: </div>
      <div v-if="txs.length === 0">Any transaction</div>
      <br/>
      <div
        v-for="tx in txs"
        v-bind:key="tx.transactionHash"
        class="transaction"
      >
        <div>BlockNumber: {{tx.blockNumber}}</div>
        <div>BlockHash: {{tx.blockHash}}</div>
        <div>TransactionHash: {{tx.transactionHash}}</div>
        <div>Type: {{tx.type}}</div>
        <div>From: {{tx.from}}</div>
        <div>To: {{tx.to}}</div>
        <div>Amount: {{tx.amount}}</div>
        <div>Fee: {{tx.fee}}</div>
        <br/>
      </div>
    </div>
    <form id="send-form" @submit="onSend" v-if="balance > 0 && !isSending">
      <div>Send:</div>
      <input
        id="send-address"
        v-model.trim="address"
        placeholder="0xA1B2C3D4E5...."
      >
      <input
        id="send-amount"
        type="number"
        step="any"
        v-model.trim="sendAmount"
        placeholder="amount"
      >
      <input id="send-submit" type="submit" value="Send">
    </form>
    <div v-if="errors.length === 0 && isSending" id="send-waiting">
      Transaction is sending, Waiting....
    </div>
    <div v-if="errors.length > 0" id="errors">
      <div>Error{{ errors.length > 1 ? "s" : "" }}: </div>
      <div
        v-for="error in errors"
        v-bind:key="error"
      >{{ error }}</div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import Vue from 'vue';
import { displayError } from '@/../../utils/errors';
const moment = require('moment');

Vue.filter('formatDate', (value) => {
  if (value) {
    return moment(new Date(value * 1000)).format('MM/DD/YYYY hh:mm');
  }
});

export default {
  name: 'Wallet',
  data() {
    return {
      sendAmount: '',
      address: '',
      errors: [],
      isSending: false
    };
  },
  computed: {
    ...mapGetters([
      'me',
      'txs',
      'ethWallet',
      'balance'
    ])
  },
  methods: {
    ...mapActions(['send']),
    onSend(e) {
      this.errors = [];
      this.isSending = true;

      this.send({
        address: this.address,
        amount: this.sendAmount
      })
        .then(() => {
          this.sendAmount = '';
          this.address = '';
          this.isSending = false;
        })
        .catch(error => {
          this.errors.push(displayError(error));
          this.isSending = false;
        });

      e.preventDefault();
    }
  }
};
</script>

<style scoped lang="scss">

</style>
