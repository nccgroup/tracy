import { domMutationsInit } from "./ext/dom-mutations";
import { locationModInit } from "./ext/location-mod";
import { methodHookingInjectorInit } from "./ext/method-hooking-injector";
import { replace } from "./shared/replace";
import { rpc } from "./shared/rpc";
import { channel } from "./shared/channel-cs";

const rp = rpc(channel);
const re = replace(rp);

(async () => {
  await re.firstCacheProm;
  locationModInit(re, rp);
})();
domMutationsInit(re, rp);
methodHookingInjectorInit();
