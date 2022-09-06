import { exec, spawn } from "child_process";

spawn(`npm i -g pnpm@7.6.0`, {shell: true, stdio: 'inherit'}).on('exit', ()=>{
    spawn(`pnpm i --frozen-lockfile --ignore-scripts`, {shell: true, stdio: 'inherit'});
});