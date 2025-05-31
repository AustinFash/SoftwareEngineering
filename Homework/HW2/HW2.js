const fs = require('fs');
const path = require('path');

//verify a record
function verifyRecord(record) {
    const requiredProp = ['IDENTIFIER', 'TIME'];
    let optionalProp = ['WEIGHT', 'COLOR'];

    if (record['WEIGHT']) {
        requiredProp.push('UNITS');
        optionalProp = optionalProp.concat('UNITS');
    }

    const allProp = requiredProp.concat(optionalProp);

    for (const property of requiredProp) {
        if (!record[property]) {
            throw new Error('ERROR: missing property: ' + property);
        }
    }

    for (const property in record) {
        if (!allProp.includes(property)) {
            throw new Error('ERROR: unknown property: ' + property);
        }
    }
}

// format and validate allRecords
function formatAndVerifyRecords(data) {
    const allRecords = [];
    let inputRecord = {};
    let inRecord = false;

    const lines = data.split('\n');
    for (const line of lines) {
        const trimmedLine = line.trim().toUpperCase();

        if (trimmedLine === 'BEGIN:RECORD') {
            if (inRecord) {
                throw new Error('ERROR: nested records are not allowed');
            }
            inRecord = true;
            inputRecord = {};
        } else if (trimmedLine === 'END:RECORD') {
            verifyRecord(inputRecord);
            allRecords.push(inputRecord);
            inRecord = false;
        } else if (inRecord) {
            const [property, value] = line.split(':').map(s => s.trim());
            if (!property || !value) {
                throw new Error('ERROR: invalid property line: ' + line);
            }
            if (inputRecord[property.toUpperCase()]) {
                throw new Error('ERROR: duplicate property: ' + property);
            }
            inputRecord[property.toUpperCase()] = value;
        }
    }

    if (inRecord) {
        throw new Error('ERROR: unclosed record');
    }

    return allRecords;
}

// sort allRecords
function sortRecords(allRecords) {
    return allRecords.sort((a, b) => a.TIME.localeCompare(b.TIME));
}

// reads, processes, and writes data
function readFile(inputFilePath, outputFilePath) {
    fs.readFile(inputFilePath, 'utf8', (err, data) => {
        if (err) {
            throw err;
        }

        try {
            const allRecords = formatAndVerifyRecords(data);
            const sortedRecords = sortRecords(allRecords);
            const outputData = JSON.stringify(sortedRecords, null, 2);

            fs.writeFile(outputFilePath, outputData, 'utf8', (err) => {
                if (err) {
                    throw err;
                }
                console.log('File processed and saved successfully.');
            });
        } catch (error) {
            console.error('Error processing fs:', error.message);
        }
    });
}

module.exports = { verifyRecord, formatAndVerifyRecords, sortRecords };

const inputFilePath = path.join(__dirname, 'input.txt');
const outputFilePath = path.join(__dirname, 'output.txt');

readFile(inputFilePath, outputFilePath);