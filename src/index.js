import Encoding from 'encoding-japanese';
const $ = document.querySelector.bind(document);

/*
FORMAT
00-2f 48 bytes | file header
    00-0f 16 bytes | [WAN WAN STORY!]
                     (first byte might be set to 0 or this might be an error?)
    10-2f 32 bytes | <padded with 0xff>

30-6f 64 bytes | a single save slot
    30-3f 16 bytes | [WAN WAN STORY!]
    40-47  9 bytes | <human name in SJIS, 2 bytes per character, up to 4 characters, terminated by 00>
    49-51  9 bytes | <dog name in SJIS, 2 bytes per character, up to 4 characters, terminated by 00>
                     (if not yet set, "？？？？" is used, fullwidth characters, 0x81 0x48 x 4)
    52-6b 26 bytes |
                     (game state, initialized to 0s)
                     (clear game's first byte is 0C)
    6c-6f  4 bytes | <16-bit sum of all 60 single bytes in this save slot up until here (0x30-0x6b)>
                     (possibly 2 bytes, max possible value 3D C2 or 4 bytes max possible 00 00 3C C3, either way only last byte is significant)

70-af 64 bytes | save #2
b0-ef 64 bytes | save #3

*/

const SAVE_FILE_BYTES = 0x2000;
const SINGLE_SAVE_BYTES = 0x40;
const SAVE_HEADER_BYTES = 0x30;
const NAME_BYTES = 9;
const SAVE_MARKER_U8 = new Uint8Array([0x5B, 0x57, 0x41, 0x4E, 0x20, 0x57, 0x41, 0x4E, 0x20, 0x53, 0x54, 0x4F, 0x52, 0x59, 0x21, 0x5D]);

const STATE_CLEARED_U8 = new Uint8Array(30);
STATE_CLEARED_U8[0] = 0x0C;

function saveBufferToFile(buffer, filename = 'wanwan.sav') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buffer], {type: 'application/octet-stream'}));
    a.download = filename;
    a.click();
}

function getNameBytes(saveNum, nameClass) {
    const nameU8 = new Uint8Array(NAME_BYTES);
    // nameU8.fill(0xff); // makes any difference?
    const $name = $(`.save${saveNum} input.${nameClass}`);
    let name = $name.value;

    if (Encoding.detect(name) === 'ASCII') {
        name = Encoding.toZenkakuCase(name);
        $name.value = name;
    }

    const nameUnicode = Encoding.stringToCode($name.value);
    const nameSJIS = Encoding.convert(nameUnicode, {from: 'UNICODE', to: 'SJIS'});
    nameU8.set(nameSJIS, 0);
    nameU8.set([0x00], Math.min(nameSJIS.length, nameU8.length - 1));
    // console.log($name.value, nameUnicode.map(x => x.toString(16)), nameSJIS.map(x => x.toString(16)), nameU8);
    return nameU8;
}

function sumBytes(bufferU8, start, end) {
    // no overflow check necessary
    let sum = 0x0;
    for (let i = start; i < end; i++) {
        sum += bufferU8[i];
    }
    return sum;
}

$('#go').addEventListener('click', () => {
    const saveBuffer = new ArrayBuffer(SAVE_FILE_BYTES);
    const saveBufferU8 = new Uint8Array(saveBuffer);

    // 48-byte file header
    saveBufferU8.fill(0xff, 0, SAVE_HEADER_BYTES);
    saveBufferU8.set(SAVE_MARKER_U8, 0);

    const [M, N, S] = [SAVE_MARKER_U8.byteLength, NAME_BYTES, STATE_CLEARED_U8.byteLength];
    console.assert(SINGLE_SAVE_BYTES === M + 2*N + S);

    for (let saveNum = 0; saveNum < 3; saveNum++) {
        const pos = SAVE_HEADER_BYTES + saveNum * SINGLE_SAVE_BYTES;

        // header
        saveBufferU8.set(SAVE_MARKER_U8, pos);

        // human name
        saveBufferU8.set(getNameBytes(saveNum, 'you'), pos + M);

        // dog name
        saveBufferU8.set(getNameBytes(saveNum, 'dog'), pos + M + N);

        // clear game
        saveBufferU8.set(STATE_CLEARED_U8, pos + M + N + N);

        // checksum
        const sum = sumBytes(saveBufferU8, pos, pos + SINGLE_SAVE_BYTES - 2);
        saveBufferU8[pos + SINGLE_SAVE_BYTES - 2] = (sum >> 8) & 0xff;
        saveBufferU8[pos + SINGLE_SAVE_BYTES - 1] = sum & 0xff;
    }

    saveBufferToFile(saveBuffer);
});


