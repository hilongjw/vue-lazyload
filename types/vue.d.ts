/**
 * Augment the typings of Vue.js
 */

import Vue from "vue";
import { LazyloadHandler } from "./index";

declare module "vue/types/vue" {
  interface Vue {
    $Lazyload: LazyloadHandler;
  }
}

