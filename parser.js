import fs from 'fs'
import {Firestore} from '@google-cloud/firestore'
import importExport from 'node-firestore-import-export'

const importData = importExport.firestoreImport

// Initialize Firestore
const firestore = new Firestore();

// File names
const fileNames = [
    '2023-05-13T16_35_29_80884_all_namespaces_all_kinds_output-0',
    '2023-05-13T16_35_29_80884_all_namespaces_all_kinds_output-1',
    '2023-05-13T16_35_29_80884_all_namespaces_all_kinds_output-2',
    '2023-05-13T16_35_29_80884_all_namespaces_all_kinds_output-3'];

// Function to process records
function processRecords(records) {
    records.forEach(record => {
        // Process each record
        console.log(record);
    });
}

// Process all files
fileNames.forEach(fileName => {
    fs.readFile(fileName, (err, fileContent) => {
        if (err) {
            console.error(`Error reading file ${fileName}:`, err);
            return;
        }

        // Import the data to a temporary Firestore instance
        importData(fileContent, { firestoreInstance: firestore })
            .then(collections => {
                // Process the records
                for (const collectionName in collections) {
                    const collectionRecords = collections[collectionName];
                    processRecords(collectionRecords);
                }
            })
            .catch(error => {
                console.error(`Error importing data from file ${fileName}:`, error);
            });
    });
});