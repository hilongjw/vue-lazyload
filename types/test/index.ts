import Vue from "vue";
import VueLazyload, { VueLazyloadOptions } from "../index";

Vue.use<VueLazyloadOptions>(VueLazyload);

Vue.use<VueLazyloadOptions>(VueLazyload, {
  preLoad: 0,
});

const vm = new Vue({});

vm.$Lazyload.lazyLoadHandler();
vm.$Lazyload.$on('loading', function (state, cache) {
  const err: string = state.error;
  const el: Element = state.el;
  const bol: boolean = cache;
});