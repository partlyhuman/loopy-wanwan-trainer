const $ = document.querySelector.bind(document);

/*
FORMAT
00-2f 48 bytes | file header
    00-0f 16 bytes | [WAN WAN STORY!]
                     (first byte might be set to 0 or this might be an error?)
    10-2f 64 bytes | <padded with 0xff>

(possibly delete first byte to 0?)

30-6f 64 bytes | a single save slot
    30-3f 16 bytes | [WAN WAN STORY!]
    40-47  9 bytes | <human name in SJIS, 2 bytes per character, up to 4 characters, terminated by 00>
    49-51  9 bytes | <dog name in SJIS, 2 bytes per character, up to 4 characters, terminated by 00>
                     (if not yet set, "？？？？" is used, fullwidth characters, 0x81 0x48 x 4)
    52-6f 30 bytes |
                     (save data, starting with 0x00)
                     (just started = 000...0D32)
                     (just started = 000000000000000000000000000000000000000000000000000000000C32)
                     (clear game = 020000000000000000000000000000000000000000000000000000000DAF)

70-af 64 bytes | save #2
b0-ef 64 bytes | save #3

*/

const SAVE_BYTES = 64;
const SAVE_HEADER_WORDS = [0x5B57, 0x414E, 0x2057, 0x414E, 0x2053, 0x544F, 0x5259, 0x215D];

function saveBufferToFile(buffer, filename = 'wanwan.sav') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buffer], {type: 'application/octet-stream'}));
    a.download = filename;
    a.click();
}

$('#go').addEventListener('click', () => {
    const saveBuffer = new ArrayBuffer(SAVE_BYTES);
    const save = new Uint8Array(saveBuffer);
    const view = new DataView(saveBuffer);

    // add header
    for (let i = 0; i < SAVE_HEADER_WORDS.length; i++) {
        console.log(i);
        view.setUint16(i * 2, SAVE_HEADER_WORDS[i]);
    }

    saveBufferToFile(save);
});


