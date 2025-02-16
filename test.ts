import { modelDiff } from "./util.js";


const from1 = { id: "1", name: "A", age: 10 };
const to1 = { id: "1", name: "B", age: 10 };
const diff1 = modelDiff(from1, to1);
const diff2 = modelDiff(from1, {});
const diff3 = modelDiff({}, to1);

console.log(JSON.stringify(diff1));
console.log(JSON.stringify(diff2));
console.log(JSON.stringify(diff3));

const from2