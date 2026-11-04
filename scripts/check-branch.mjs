import {execFileSync} from 'node:child_process';
const branch=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();if(branch!=='feat/spacelab-mvas')throw Error('Build must run on feat/spacelab-mvas, got '+branch);console.log('Independent build source: '+branch);
