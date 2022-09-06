"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
(0, child_process_1.spawn)(`npm i -g pnpm@7.6.0`, { shell: true, stdio: 'inherit' }).on('exit', () => {
    (0, child_process_1.spawn)(`pnpm i --frozen-lockfile --ignore-scripts`, { shell: true, stdio: 'inherit' });
});
