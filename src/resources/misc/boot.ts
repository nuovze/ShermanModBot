import * as fs from 'fs';
import * as path from 'path';

let boot: string;
boot = fs.readFileSync(path.resolve(__dirname, "boot.txt"), "utf8");

export default boot;