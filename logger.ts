
const LOG_LEVEL_DEBUG = 3;
const LOG_LEVEL_INFO = 2;
const LOG_LEVEL_WARN = 1;
const LOG_LEVEL_ERROR = 0;

const tags: Map<string, number> = new Map();

export default function logger(tag: string) {

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

    function level(level: number) {
        console.log(`level() [${tag}] = ${level}.`);
        tags.set(tag, level);
    }

    return { log, err, dbg, level };
}

function setLog(tag: string, level: number) {
    console.log(`setLog() [${tag}] = ${level}.`);
    tags.set(tag, level);
}

export { setLog, LOG_LEVEL_DEBUG, LOG_LEVEL_INFO, LOG_LEVEL_WARN, LOG_LEVEL_ERROR };