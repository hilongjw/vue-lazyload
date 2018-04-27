import "./vue";
import { VueLazyLoad } from "./lazyload";

declare var VueLazyLoad: PluginObject<LazyOptions>;
export default VueLazyLoad;

export {
  LazyloadImage,
  LazyOptions,
  LazyloadHandler,
} from "./lazyload";
