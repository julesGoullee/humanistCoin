import createLogger from 'vuex/dist/logger';
import config from '@/../../config';
import { analyticsMiddleware } from 'vue-analytics';

const plugins = [analyticsMiddleware];

if(config.ENV !== 'production'){
  plugins.push(createLogger() );
}

export default plugins;
