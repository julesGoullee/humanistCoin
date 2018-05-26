import createLogger from 'vuex/dist/logger';
import config from '@/../../config';

const plugins = config.ENV !== 'production' ? [createLogger()] : [];

export default plugins;
