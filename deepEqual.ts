function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (typeof a !== 'object' || typeof b !== 'object') {
        return a === b; // handle primitive types including numbers
    }

    if (Object.keys(a).length !== Object.keys(b).length) return false;

    for (const key in a) {
        if (!(key in b)) return false;
        if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
}

export default deepEqual ;