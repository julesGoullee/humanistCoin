import Vue from 'vue';
import { sync } from 'vuex-router-sync';
import '@/plugins/registerServiceWorker';
import '@/plugins/sentry';
import '@/plugins/ga';
import '@/plugins/hotjar';

import App from '@/App.vue';
import router from '@/router';
import store from '@/store';

Vue.config.productionTip = false;
sync(store, router);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
