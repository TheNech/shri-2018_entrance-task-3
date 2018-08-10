const fs = require('fs');
const { calculateEnergyCost } = require('./js/calculateEnergyCost');

const input = process.argv[2] ? fs.readFileSync(process.argv[2]) : fs.readFileSync('./data/input.json');

fs.writeFileSync('./data/output.json', calculateEnergyCost(input));

console.log('Суточное расписание сформировано и находится в файле ./data/output.json');
