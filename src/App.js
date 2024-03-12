import React, { useEffect, useState } from 'react';
import { useLocation, BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Editor from './Editor.js';
import Navbar from './Navbar.js';
import Template from './Pages/Template.js';
import TableOfContents from './Pages/TableOfContents.js';
import { marked } from 'marked';

function App() {
  const location = useLocation();
  const initialPage = location.pathname.substring(1);
  const [page, setPage] = useState(initialPage || 'Home');
  const [assignments, setAssignments] = useState({});
  const [examples, setExamples] = useState({});
  const [references, setReferences] = useState({});
  const [markdownContent, setMarkdownContent] = useState("");

  const exampleFiles = [
    'FirstSteps', 'FourierTheorem',  'GUI', 'SubtractiveSynth', 'Temperaments', 'Aliasing', 'AmplitudeModulation', 
    'FrequencyModulation','MIDI', 'Sampler', 'GranularSynth', 'Physical Model', 'SequencerGui', 'Drums'
  ];
  const assignmentFiles = [
    'Lab1','JavaScript101', 'VCOMixer', 'Sequencer', 'FMOperator', 'WaveFolder', 'KarplusStrong'
    //,'PhaseLab', 'PhaseLab2'
    //,'MarkovChains', 'Perceptron'
  ];
  const referenceFiles = [
    'Oscillator', 'Filter', 'Multiply', 'Knob', 'GUI elements', 'Envelope', 'Oscilloscope', 'Spectroscope', 'Noise', 'Player', 'Convolver', 'Panner3D'
  ];

  const homeStarterCode = `/*
  Alt-Enter: Evaluate Line in Live Mode
  Alt-Shift-Enter: Evaluate Block in Live Mode
*/`;


  useEffect(() => {
    const importFiles = async (files, folder) => {
      const fetchedAssignments = {};

      for (const fileName of files) {
        try {
          const introRes = await fetch(`${process.env.PUBLIC_URL}/${folder}/${fileName}/Intro.txt`);
          const starterCodeRes = await fetch(`${process.env.PUBLIC_URL}/${folder}/${fileName}/StarterCode.js`);
          const descriptionRes = await fetch(`${process.env.PUBLIC_URL}/${folder}/${fileName}/Description.txt`);

          if (!introRes.ok || !starterCodeRes.ok || !descriptionRes.ok) {
            throw new Error('Fetching files failed');
          }

          let intro = await introRes.text();
          intro = marked(intro);
          const starterCode = await starterCodeRes.text();
          let description = await descriptionRes.text();
          description = marked(description);

          fetchedAssignments[fileName] = {
            intro,
            starterCode,
            description,
            canvases: [fileName],
          };
        } catch (error) {
          console.error(`Error importing ${fileName}:`, error);
        }
      }
      return fetchedAssignments;
    };

    (async () => {
      const assignments = await importFiles(assignmentFiles, 'assignments');
      const examples = await importFiles(exampleFiles, 'examples');
      const references = await importFiles(referenceFiles, 'references');

      setAssignments(assignments);
      setExamples(examples);
      setReferences(references);
      //console.log(references);
    })();
  }, []);

  return (
    <div className="outer-container">
      <Navbar page={page} setPage={setPage} />
      <Routes>
        <Route path="/" element={<Editor page={page} starterCode={homeStarterCode} canvases={["Canvas1", "Canvas2", "Canvas3"]} />} />
        <Route path="/TableOfContents" element={<TableOfContents assignments={assignments} examples={examples} references={references} setPage={setPage} />} />
        {Object.entries(assignments).map(([title, props]) => (
          <Route key={title} path={`/${title}`} element={<Template page={title} title={title} intro={props.intro} starterCode={props.starterCode} description={props.description} canvases={props.canvases} />} />
        ))}
        {Object.entries(examples).map(([title, props]) => (
          <Route key={title} path={`/${title}`} element={<Template page={title} title={title} intro={props.intro} starterCode={props.starterCode} description={props.description} canvases={props.canvases} />} />
        ))}
        {Object.entries(references).map(([title, props]) => (
          <Route key={title} path={`/${title}`} element={<Template page={title} title={title} intro={props.intro} starterCode={props.starterCode} description={props.description} canvases={props.canvases} />} />
        ))}
      </Routes>
    </div>
  );
}
export default App;

/*
<title>CodeMirror</title>
  <script src="../plugin/codemirror5/lib/codemirror.js"></script>
  <link rel="stylesheet" type="text/css" href="../plugin/codemirror5/lib/codemirror.css">
  <script src="../plugin/codemirror5/mode/javascript/javascript.js"></script>
*/