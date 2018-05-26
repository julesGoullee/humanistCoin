<template>
  <div id="submission">
    <form id="submission-form" @submit="onSubmit" v-if="submission.status === null">
      <select v-model="birthday.month" aria-label="Month" name="birthday_month" id="month" title="Month">
        <option value="0">Month</option>
        <option value="1">Jan</option>
        <option value="2">Feb</option>
        <option value="3">Mar</option>
        <option value="4">Apr</option>
        <option value="5">May</option>
        <option value="6">Jun</option>
        <option value="7">Jul</option>
        <option value="8">Aug</option>
        <option value="9">Sep</option>
        <option value="10">Oct</option>
        <option value="11">Nov</option>
        <option value="12">Dec</option>
      </select>
      <select
        v-model="birthday.day"
        aria-label="Day"
        name="birthday_day"
        id="day"
        title="Day">
        <option value="0">Day</option>
        <option
          v-for="i in 31"
          v-bind:key="i"
          v-bind:value="i">{{ i }}</option>
      </select>
      <select
        v-model="birthday.year"
        aria-label="Year"
        name="birthday_year"
        id="year"
        title="Year">
        <option value="0">Year</option>
        <option
          v-for="i in 100"
          v-bind:value="now.year() - i"
          v-bind:key="i"
        >{{ now.year() - i }}</option>
      </select>
      <label for="email">Emails:</label>
      <input id="email" v-model.trim="email" >
      <input id="submit" type="submit" value="Validate">
    </form>
    <div v-if="errors.length === 0 && submission.status === 'CONFIRMED'" id="submission-bc-waiting">
      Account is creating, Waiting for validation....
    </div>
    <form id="submission-oracle-form" @submit="onSubmitEmailCode" v-if="submission.status === 'PENDING'">
      <label for="email">Enter code you receive by email</label>
      <input id="email-code" v-model.trim="emailCode" >
      <input id="submit-email-code" type="submit" value="Validate">
    </form>
    <div v-if="errors.length > 0"updateState id="errors">
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
const moment = require('moment');
import { displayError } from '@/../../utils/errors';

export default {
  name: 'Submission',
  data() {
    const now = moment();
    return {
      now,
      birthday: {
        day: now.date(),
        month: now.month(),
        year: now.year() - 29
      },
      email: '',
      emailCode: '',
      errors: []
    };
  },
  computed: {
    ...mapGetters(['submission', 'me'])
  },
  methods: {
    ...mapActions(['submit', 'submitCode']),
    onSubmit(e) {
      this.errors = [];

      if (this.birthday.day && this.birthday.day !== '0' &&
        this.birthday.month && this.birthday.month !== '0' &&
        this.birthday.year && this.birthday.year !== '0' &&
        this.email && this.email.length > 0
      ) {
        const birthday = moment(Object.assign({}, this.birthday, {
          month: this.birthday.month - 1
        }));

        if (!birthday.isValid() || birthday.unix() < 0) {
          this.errors.push('Birthday is invalid');
        } else {
          this.submit({ // todo throttle to avoid multiple in same time
            email: this.email,
            birthday
          }).catch(error => this.errors.push(displayError(error) ) );
        }
      }

      if (!this.birthday.day || this.birthday.day === '0') this.errors.push('Day is required');
      if (!this.birthday.month || this.birthday.month === '0') this.errors.push('Month is required');
      if (!this.birthday.year || this.birthday.year === '0') this.errors.push('Year is required');
      if (!this.email || this.email.length === 0) this.errors.push('Email is required');
      e.preventDefault();
    },
    onSubmitEmailCode(e) {
      this.errors = [];

      if(this.emailCode && this.emailCode.length > 0){

        this.submitCode({ // todo throttle to avoid multiple in same time
          code: this.emailCode
        }).catch(error => this.errors.push(displayError(error)) );

      } else {

        this.errors.push('Code is required');

      }

      e.preventDefault();

    }

  }
};
</script>

<style scoped>

</style>
