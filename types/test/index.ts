import Vue from "vue";
import VueLazyload, { VueLazyloadOptions } from "../index";

Vue.use<VueLazyloadOptions>(VueLazyload);

Vue.use<VueLazyloadOptions>(VueLazyload, {
  preLoad: 0,
});

const vm = new Vue({});

vm.$Lazyload.lazyLoadHandler();