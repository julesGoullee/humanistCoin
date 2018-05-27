import Vue from 'vue'
import VueAnalytics from 'vue-analytics'
import config from '@/../../config';

if(config.GA_ID){

  Vue.use(VueAnalytics, {
    id: config.GA_ID
  });

}
