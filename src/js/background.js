import { routerInit } from "./ext/router";
import { requestCaptureInit } from "./ext/request-capture";
import { userActionInit } from "./ext/user-action";
import { hotReloadInit } from "./ext/hot-reload";
if (DEV) {
  hotReloadInit();
}

routerInit();
userActionInit();
requestCaptureInit();
