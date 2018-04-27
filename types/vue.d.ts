/**
 * Augment the typings of Vue.js
 */

import Vue from "vue";
import { VueLazyloadHandler } from "./index";

declare module "vue/types/vue" {
  interface Vue {
    $Lazyload: VueLazyloadHandler;
  }
}

