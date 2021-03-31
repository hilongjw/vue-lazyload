import "./vue";
import { VueLazyloadPluginObject } from "./lazyload";

declare var VueLazyload: VueLazyloadPluginObject;
export default VueLazyload;

export {
  VueLazyloadOptions,
  VueLazyloadHandler,
  VueReactiveListener,
  loadImageAsyncOption
} from "./lazyload";

