import delay from "delay";
import flatten from "lodash/flatten";
import { h } from "preact";
import { renderToString } from "preact-render-to-string";

function App() {
  return h("div", null, "hello");
}

console.log("start");
await delay(100);
console.log("end");
console.log(flatten([[1], 2]));
const html = renderToString(h(App, null));
console.log(html);
