import { xhrModInit } from "./ext/xhr-mod";
import { fetchModInit } from "./ext/fetch-mod";
import { formModInit } from "./ext/form-mod";
import { innerHTMLModInit } from "./ext/inner-html-mod";
import { replace } from "./shared/replace";
import { channel } from "./shared/channel-page";
import { rpc } from "./shared/rpc";

const rp = rpc(channel);
const re = replace(rp);
xhrModInit(re, rp);
fetchModInit(re, rp);
formModInit(re, rp);
innerHTMLModInit(rp);
