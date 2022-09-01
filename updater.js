/*
MIT License
Copyright (c) 2021 GooseNest
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

This file contains parts of code from https://github.com/Goose-Nest/GIEx1/,
but has been modified heavily.
*/

const { copyFileSync, openSync, writeSync, writeFileSync, existsSync, closeSync } = require('fs');
const { join } = require('path');

const nativeUpdaterModule = require('./updater.node');

const patch = (filename, offset, bytes) => {
    const fd = openSync(filename, "r+");
    writeSync(fd, bytes, 0, bytes.length, offset);
    closeSync(fd);
}

class Updater extends nativeUpdaterModule.Updater {

    constructor(options) {
        const originalHandler = options.response_handler;

        options.response_handler = (response) => {
            const [_id, detail] = JSON.parse(response);

            if(_id == 1) {
                const krispModuleDir = join(__dirname, 'modules', 'discord_krisp-' + detail?.VersionInfo?.current_modules?.discord_krisp);
                if(!existsSync(join(krispModuleDir, 'discord_krisp', 'patch'))) {
                    console.log('(krispPatch) Looks like the krisp binary has not been patched yet, doing that now!');
                    try {
                        patch(join(krispModuleDir, 'discord_krisp', 'discord_krisp.node'), 0xABCD, new Uint8Array([0x00]));
                        writeFileSync(join(krispModuleDir, 'discord_krisp', 'patch'), ":)");
                        console.log('(krispPatch) Done :)');
                    }
                    catch(e) {
                        console.log('(krispPatch) Patch failed :(');
                        console.error(e);
                    }
                }
            }

            if (detail['TaskProgress'] != null) {
                const TaskProgress = detail['TaskProgress'];

                if (TaskProgress[0].HostInstall && TaskProgress[1] === 'Complete') { // A host update has been installed, install this hook into it
                    console.log('(krispPatch) Detected host update, rehooking.');

                    const newAppDir = join(__dirname, '..', '..', `app-${TaskProgress[0].HostInstall.version.version.join('.')}`);
                    copyFileSync(join(__dirname, 'updater.js'), join(newAppDir, 'updater.js')); // Copy this file

                    console.log('(krispPatch) Rehooked.');
                }
            }

            return originalHandler(response);
        }

        super(options);
    }
}

module.exports = { Updater };
