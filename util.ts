

function printDiff(name: string, a: any, b: any) {
    Object.keys(a).forEach(k => {
        if (a[k] !== b[k]) {
            console.log(name, k, a[k], b[k]);
        }
    });
}

export { printDiff }