import { App } from 'vue'
type PluginFunction<T> = (Vue: App, options?: T) => void;

interface PluginObject<T> {
  install: PluginFunction<T>;
  [key: string]: any;
}
interface IntersectionObserverInit {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export interface VueLazyloadImageOptions {
  src: string;
  error: string;
  loading: string;
  attempt: number;
}

export interface loadImageAsyncOption {
  src: string;
  cors?: string;
}

export interface VueLazyloadOptions {
  lazyComponent?: boolean;
  lazyImage?: boolean;
  preLoad?: number;
  error?: string;
  loading?: string;
  cors?: string;
  attempt?: number;
  listenEvents?: string[];
  supportWebp?: boolean;
  adapter?: any;
  filter?: any;
  dispatchEvent?: boolean;
  throttleWait?: number;
  observer?: boolean;
  observerOptions?: IntersectionObserverInit;
  silent?: boolean;
  preLoadTop?: number;
  scale?: number;
}


export interface Performance {
  init: number;
  loadStart: number;
  loadEnd: number;
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
  performanceData: Performance;
}

export interface VueLazyloadListenEvent {
  (listener: VueReactiveListener, cache: boolean) : void;
}

export interface VueLazyloadHandler {
  $on (event: string, callback: VueLazyloadListenEvent): void;
  $once (event: string, callback: VueLazyloadListenEvent): void;
  $off (event: string, callback?: VueLazyloadListenEvent): void;
  lazyLoadHandler (): void;
}

export interface VueLazyloadPluginObject extends PluginObject<VueLazyloadOptions> {}
