import "./vue";
import { VueLazyloadPluginObject } from "./lazyload";

declare var VueLazyload: VueLazyloadPluginObject;
export default VueLazyload;

export {
  VueLazyloadImage,
  VueLazyloadOptions,
  VueLazyloadHandler,
  VueReactiveListener
} from "./lazyload";
