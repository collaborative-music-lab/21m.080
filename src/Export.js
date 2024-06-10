import {index_html} from './Exports/index_content.js'

const JSZip = require('jszip');

const htmlContent = index_html

const jsHeader = `
import { sketch } from './p5Library';

import p5 from 'p5';
import * as Tone from 'tone';
import { Oscilloscope, Spectroscope } from './libraries/oscilloscope';
import MidiKeyboard from './libraries/MidiKeyboard.js';
const midi = require('./libraries/Midi.js');

`

export const jsContent = `
console.log("Hello from script.js!");
// Your JavaScript code goes here
`;

export function exportFiles(code){
    exportFilesToZip(code).then((zipBlob) => {
        // You can now download the zipBlob, for example, as a downloadable link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(zipBlob);
        downloadLink.download = 'myZipFile.zip';
        downloadLink.click();
    });
}

export function exportFilesToZip(code) {
    // Create a new instance of JSZip
    const zip = new JSZip();

    const filesToInclude = {
        './exports/MidiKeyboard.js': 'libraries/MidiKeyboard.js',
        './exports/p5Elements.js': 'libraries/p5Elements.js',
        './exports/p5Library.js': 'libraries/p5Library.js',
        './exports/p5Themes.json': 'libraries/p5Themes.json',
        './exports/Midi.js': 'libraries/Midi.js',
        './exports/oscilloscope.js': 'libraries/oscilloscope.js',
      };

      // Create a Blob containing the JavaScript content
    const jsBlob = new Blob([jsHeader + jsContent + code], { type: 'text/javascript' });

    // Add HTML content to the zip file
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    zip.file('index.html', htmlBlob);

    // Add JavaScript content to the zip file
    zip.file('script.js', jsBlob);

    // Add JavaScript content to the zip file
    zip.file('Midi.js', jsBlob);


    // Add files to the zip
    const promises = Object.entries(filesToInclude).map(([filePath, storagePath]) => {
        return getFileContent(filePath).then((fileContent) => {
          zip.file(storagePath, fileContent);
          // console.log(filePath, storagePath);
        });
    });



    // After all files are added, generate the zip
  return Promise.all(promises).then(() => {
    return zip.generateAsync({ type: 'blob' });
  });

    // // Create a Blob containing the HTML content
    // //const htmlBlob = new Blob([htmlContent], { type: 'text/html' });

    // const htmlBlob = new Blob(
    //     [htmlContent], 
    //     { type: 'text/html' 
    // });
    

    // // Create a Blob containing the JavaScript content
    // const jsBlob = new Blob([jsContent, code], { type: 'text/javascript' });

    // // Add HTML content to the zip file
    // zip.file('index.html', htmlBlob);

    // // Add JavaScript content to the zip file
    // zip.file('script.js', jsBlob);

    // // Generate the zip file asynchronously
    // zip.generateAsync({ type: 'blob' }).then(function (content) {
    //     // Create a Blob containing the zip content
    //     const zipBlob = new Blob([content], { type: 'application/zip' });

    //     // Create an anchor element for downloading the zip file
    //     const zipDownloadLink = document.createElement('a');
    //     zipDownloadLink.href = URL.createObjectURL(zipBlob);
    //     zipDownloadLink.download = 'm080_synth.zip';

    //     // Trigger the download
    //     zipDownloadLink.click();
    // });
}

function getFileContent(filePath) {
  return fetch(filePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      //console.log(filePath, response.text());
      return response.text(); // You can use response.text() or response.arrayBuffer() based on your needs
    })
    .catch((error) => {
      console.error(`Error fetching file: ${error.message}`);
      return ''; // Return an empty string or handle the error as needed
    });
}
