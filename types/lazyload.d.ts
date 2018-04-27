import { PluginObject } from "vue";

interface IntersectionObserverInit {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export interface VueLazyloadImage {
  src: string;
  error: string;
  loading: string;
}

export interface VueLazyloadOptions {
  lazyComponent?: boolean;
  preLoad?: number;
  error?: string;
  loading?: string;
  attempt?: number;
  listenEvents?: string[];
  adapter?: any;
  filter?: any;
  dispatchEvent?: boolean;
  throttleWait?: number;
  observer?: boolean;
  observerOptions?: IntersectionObserverInit;
  silent?: boolean;
  preLoadTop?: number;
  scale?: number;
  hasbind?: boolean;
}

export interface VueReactiveListener {
  el: Element;
  src: string;
  error: string;
  loading: string;
  bindType: string;
  attempt: number;
  naturalHeight: number;
  naturalWidth: number;
  options: VueLazyloadOptions;
  rect: DOMRect;
  $parent: Element
  elRenderer: Function;
  performanceData: {
    init: number,
    loadStart: number,
    loadEnd: number
  };
}

export interface VueLazyloadHandler {
  $on (event: string, callback: Function): void;
  $once (event: string, callback: Function): void;
  $off (event: string, callback?: Function): void;
  lazyLoadHandler (): void;
}

export interface VueLazyloadPluginObject extends PluginObject<VueLazyloadOptions> {}
