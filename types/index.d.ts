import "./vue";
import { VueLazyLoadPluginObject } from "./lazyload";

declare var VueLazyLoad: VueLazyLoadPluginObject;
export default VueLazyLoad;

export {
  LazyloadImage,
  LazyloadOptions,
  LazyloadHandler,
  ReactiveListener
} from "./lazyload";
