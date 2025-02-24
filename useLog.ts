
const LOG_LEVEL_DEBUG = 3;
const LOG_LEVEL_INFO = 2;
const LOG_LEVEL_WARN = 1;
const LOG_LEVEL_ERROR = 0;

const tags: Map<string, number> = new Map();

export default function useLog(tag: string) {
    console.log(`[${tag}] Log entry.`);

    // Default to info
    if (!tags.has(tag)) tags.set(tag, LOG_LEVEL_INFO);

    function dbg(...params: any) {
        if (tags.get(tag) < LOG_LEVEL_DEBUG) return;
        console.log(`DEBUG[${tag}]`, ...params);
    }
    function log(...params: any) {
        if (tags.get(tag) < LOG_LEVEL_INFO) return;
        console.log(`LOG[${tag}]`, ...params);
    }

    function err(...params: any) {
        console.error(`ERR[${tag}]`, ...params);
    }
    return { log, err, dbg };

}

function setLog(tag: string, level: number) {
    console.log(`setLog() [${tag}] = ${level}.`);
    tags.set(tag, level);
}

export { setLog };