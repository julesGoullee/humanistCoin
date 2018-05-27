import Vue from 'vue'
import VueAnalytics from 'vue-analytics'
import config from '@/../../config';
import router from '@/router';

if(config.GA_ID){

  Vue.use(VueAnalytics, {
    id: config.GA_ID,
    router,
    debug: {
      screenview: true,
      skipSamePath: true,
      enabled: config.ENV !== 'production',
      sendHitTask: config.ENV === 'production'
    }
  });

}
