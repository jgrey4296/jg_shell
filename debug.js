const repl = require('repl');
const cli = repl.start();
//Add imports, definitions etc here
import { Shell } from './src/Shell.js'

let s = new Shell();

//Then add to the cli context:
cli.context.shell = s;
