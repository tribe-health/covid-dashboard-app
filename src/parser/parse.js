const fs = require('fs');
const utils = require('./utils');
const constants = require('./constants');
const transform = require('./transform');

function parseSim(
    path,
    result, 
    geoids,
    scenario,
    severity,
    sim,
    getIdx) {
    // returns Object of Array series of sim values by geoID
    
    try {
        const data = fs.readFileSync(path, 'UTF-8');
        const lines = data.split(/\r?\n/);

        // reduce simulations down to 30%
        // if (simNum % 3 === 0) {
        if (sim) {
            lines.forEach((line) => {

                const geoid = line.split(',')[getIdx['geoid']];

                // only include specified geoid
                if (geoids.includes(geoid)) {

                    if (utils.notHeaderOrEmpty(line)) {

                        const params = constants.parameters;
                        for (let p = 0; p < params.length; p ++) {

                            const param = params[p]; 
                            const val = parseInt(line.split(',')[getIdx[param]]);
                            const simObj = result[geoid][scenario][severity][param]['sims']

                            if (sim in simObj) {
                                simObj[sim].push(val);
                            } else {
                                simObj[sim] = [val];
                            }
                        }
                    }
                }
            });
        }

    } catch (err) {
        console.error(err);
    };
};

module.exports = {
    parseDirectories: function parseDirectories(
        dir,
        geoids,
        scenarios,
        severities,
        parameters,
        dates
        ) {
        // parses entire model package of multiple scenario directories
        // returns result Object

        console.log('start:', new Date()); 

        const result = utils.initObj(
            geoids,
            scenarios,
            severities,
            parameters,
            dates
            );
            
        for (let s = 0; s < scenarios.length; s ++) {
            console.log('-----> parsing scenario...', scenarios[s])

            const scenarioDir = `${dir}${scenarios[s]}/`;
            const files = fs.readdirSync(scenarioDir)
                .filter(file => file !== '.DS_Store')
                .slice(0,3);

            // get index mapping based on parameters and headers
            let getIdx = {};
            if (files.length > 0) {
                const headers = utils.getHeaders(`${scenarioDir}${files[0]}`);
                getIdx = utils.getIdx(headers, parameters); 
            } else {
                console.log(`No files in directory: ${scenarioDir}`)
            }

            // parse by sim file
            for (let f = 0; f < files.length; f ++) {
                const severity = files[f].split('_')[0];
                const sim = parseInt(files[f].split('_death-')[1].split('.')[0]);
                console.log(sim, severity)

                parseSim(
                    scenarioDir + files[f],
                    result,
                    geoids,
                    scenarios[s],
                    severity,
                    sim,
                    getIdx)
            }
        };

        // transform each simObj to D3-friendly format
        transform.toD3format(result, geoids, scenarios);

        return result;
    }
}

// snippet for debugging this module
// const dir = 'store/sims/';
// const geoInput = ['06085', '06019']; //'06019'; // '25017'; //'01081'; 
// const scenarios = fs.readdirSync(dir)
//     .filter(file => file !== '.DS_Store')
//     .slice(0,1); // shorten

// // faster to getDates from the get-go
// let dates = [];
// if (scenarios.length > 0) {
//     const files = fs.readdirSync(dir + scenarios[0] + '/',)
//         .filter(file => file !== '.DS_Store');
//     dates = utils.getDates(dir + scenarios[0] + '/' + files[0]);
// } else {
//     console.log(`No scenario directories: ${dir}`)
// }

// const result = module.exports.parseDirectories(
//     dir,
//     geoInput,
//     scenarios,
//     constants.severities,
//     constants.parameters,
//     dates
//     )