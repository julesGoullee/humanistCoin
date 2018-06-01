import Vue from 'vue';
import Raven from 'raven-js';
import RavenVue from 'raven-js/plugins/vue';
import config from '@/../../config';

if (config.SENTRY_URL) {
  Raven.config(config.SENTRY_URL)
    .addPlugin(RavenVue, Vue)
    .install();
}
