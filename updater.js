const fs = require('fs');
const path = require('path');

function decodeBytes(hexString) {
    const hexArray = hexString.split(' ').map(byte => parseInt(byte, 16));
    return Buffer.from(hexArray);
}

function patch(filename, findHexString, replaceHexString) {
    const bytesToFind = decodeBytes(findHexString);
    const bytesToReplace = decodeBytes(replaceHexString);

    if (bytesToFind.length !== bytesToReplace.length) {
      console.error('(krisp-patch) Find and replace byte sequences must be of the same length, aborting patch.');
        return false;
    }

    const fildFd = fs.openSync(filename, 'r+');
    const file = fs.readFileSync(fildFd);

    const findLength = bytesToFind.length;
    const fileLength = file.length;

    let found = false;
    for (let i = 0; i <= fileLength - findLength; i++) {
        if (file.subarray(i, i + findLength).equals(bytesToFind)) {
            bytesToReplace.copy(file, i);
            found = true;
            console.log(`(krisp-patch) Pattern found and patched at offset 0x${i.toString(16)}`);
            break;
        }
    }

    if (!found) {
      console.error('(krisp-patch) Bytes not found in file, aborting patch.');
        return false;
    }

    fs.writeFileSync(fildFd, file);
    console.log('(krisp-patch) File patched successfully :3');
    return true;
}

const bytesToFind = process.platform == "win32" ? "41 57 41 56 41 54 56 57 55 53 48 81 EC 50 02 00 00" : "55 41 57 41 56 53 48 81 EC 78 20 00 00";
const bytesToReplace = process.platform == "win32" ? "B8 01 00 00 00 C3 56 57 55 53 48 81 EC 50 02 00 00" : "B8 01 00 00 00 C3 48 81 EC 78 20 00 00";

const krispPath = path.join(__dirname, "..", "..", "modules");
const krispDir = fs.readdirSync(krispPath).find(dir => dir.startsWith("discord_krisp-"));
if (!krispDir) {
    console.error('(krisp-patch) Krisp module directory not found, aborting patch.');
} else {
    if(!fs.existsSync(path.join(krispPath, krispDir, "discord_krisp", "patched"))) {
      const krispFile = path.join(krispPath, krispDir, "discord_krisp", "discord_krisp.node");
      if(patch(krispFile, bytesToFind, bytesToReplace)) {
          fs.writeFileSync(path.join(krispPath, krispDir, "discord_krisp", "patched"), ":3");
      }
    } else {
      console.warn('(krisp-patch) Krisp module already patched, skipping.');
    }
}
