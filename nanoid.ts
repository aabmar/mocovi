
// This file is a part of nanoid package
// Due to not being exported in the original package, and then
// giving import errors, I just lifted the code from the package

let urlAlphabet =
    'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
let customAlphabet = (alphabet: string, defaultSize = 21) => {
    return (size = defaultSize) => {
        let id = ''
        let i = size | 0
        while (i--) {
            id += alphabet[(Math.random() * alphabet.length) | 0]
        }
        return id
    }
}

let nanoid = (size = 21) => {
    let id = ''
    let i = size | 0
    while (i--) {
        id += urlAlphabet[(Math.random() * 64) | 0]
    }
    return id
}

export { nanoid, customAlphabet }