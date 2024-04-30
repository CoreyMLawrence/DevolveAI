// Import GoogleGenerativeAI module
import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai';

// Function to fetch the contents of a file
async function getFileContents(filename) {
  const response = await fetch(filename);
  const text = await response.text();
  return text;
}

// Initialize GoogleGenerativeAI object with your API key
async function initializeGenerativeAI() {
  // Fetch API key from api_key.txt
  const key = await getFileContents('api_key.txt');
  const API_KEY = key.trim(); // Remove leading/trailing whitespace

  // Return the initialized GoogleGenerativeAI object
  return new GoogleGenerativeAI(API_KEY);
}

// Fetch the contents of the output.txt file
let outputText = await getFileContents('output.txt');

//minimizing assembly size to help with limits on AI query size.
function minimizeAssembly(assemblyCode) {
  // Remove unnecessary characters and comments
  let minimizedCode = assemblyCode.replace(/\/\/.*$/gm, ''); // Remove single-line comments
  minimizedCode = minimizedCode.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
  minimizedCode = minimizedCode.replace(/\s+/g, ' '); // Remove extra whitespaces

  // Shorten register names
  minimizedCode = minimizedCode.replace(/%rax/g, 'a');
  minimizedCode = minimizedCode.replace(/%rbx/g, 'b');
  minimizedCode = minimizedCode.replace(/%rcx/g, 'c');
  minimizedCode = minimizedCode.replace(/%rdx/g, 'd');
  // Add more replacements for other registers as needed

  // Simplify instructions
  minimizedCode = minimizedCode.replace(/movq/g, 'mov');
  minimizedCode = minimizedCode.replace(/addq/g, 'add');
  minimizedCode = minimizedCode.replace(/subq/g, 'sub');
  minimizedCode = minimizedCode.replace(/mulq/g, 'mul');
  // Add more replacements for other instructions as needed

  // Remove redundant labels
  minimizedCode = minimizedCode.replace(/\.L\d+:/g, ''); // Remove labels

  return minimizedCode.trim(); // Trim leading/trailing whitespace
}

outputText = minimizeAssembly(outputText);

function formatCCode(inputCode, displayLineCallback) {
  // Remove occurrences of "```" or "cpp"
  inputCode = inputCode.replace(/```|cpp/g, '');

  // Remove occurrences of "c++"
  inputCode = inputCode.replace(/c\+\+/g, '');

  // Split input code into lines
  let lines = inputCode.split('\n');

  let indentStack = []; // Stack to track indentation levels
  let namespaceStd = false; // Flag to track if "using namespace std;" has been encountered

  // Loop through each line of code
  lines.forEach(async (line) => {
    // Trim the line
    line = line.trim();

    // Check if the line contains "using namespace std;"
    if (line.includes('using namespace std;')) {
      namespaceStd = true;
    }

    // Calculate the indentation level for the current line
    let indentLevel = indentStack.length;

    // Adjust the indent stack based on opening and closing brackets
    let openBrackets = line.split('{').length - 1;
    let closeBrackets = line.split('}').length - 1;
    let indentChange = openBrackets - closeBrackets;

    if (indentChange < 0) {
      // Decrease the indentation level
      let absIndentChange = Math.abs(indentChange);
      for (let i = 0; i < absIndentChange; i++) {
        indentStack.pop();
      }
      // Update the indentation level after removing indentations
      indentLevel = indentStack.length;
    }

    // Construct the formatted line with calculated indentation
    let formattedLine = ' '.repeat(indentLevel * 4) + line;

    // Display the formatted line on the HTML page
    displayLineCallback(formattedLine);

    if (indentChange > 0) {
      // Increase the indentation level
      indentStack.push(indentChange);
    }

    // Check if "using namespace std;" has been encountered and add a new line
    if (namespaceStd && !line.includes(';')) {
      // Append a new line
      displayLineCallback('\n');

      // Reset the flag
      namespaceStd = false;
    }

    // Check if the indentation level is zero and there is a closing bracket
    if (indentLevel === 0 && closeBrackets > 0) {
      // Append an extra new line
      displayLineCallback('\n');
    }
  });
  // Get the loader element by its class name
  var loader = document.querySelector('.loader');

  // Check if the loader element exists
  if (loader) {
    // Hide the loader element
    loader.style.display = 'none';
  } else {
    console.error('Loader element not found.');
  }
}

// Function to generate text and update HTML content
async function run() {
  // Initialize GoogleGenerativeAI object with the API key
  const genAI = await initializeGenerativeAI();

  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  // Construct the prompt by concatenating outputText with additional prompt text
  let prompt =
    "'DO NOT INCLUDE BACKTICKS IN THE RESPONSE. PROVIDE ONLY CODE IN YOUR RESPONSE, NO OTHER TEXT.  - This is assembly code from an objdump of a C++ code program. Give me the original C++ using namespace std code for this assembly code: \n\n" +
    outputText +
    'MUST INCLUDE ALL NEEDED LIBRARIES FOR THE CODE TO RUN AND MUST INCLUDE "using namespace std;\'"' +
    'ALWAYS Include using namespace std; using namespace std always goes directly after included libraries. For and while loop conditions are explicitly stated. If statements should always use opening and closing brackets. Include necessary libraries for the code to run. Do not add any extra comments. Output messages should be geared toward the user, not the programmer. All variables should be descriptive. Use arrays where needed, not vectors';
  console.log('prompt1: ', prompt);
  let result = await model.generateContent(prompt); // Specify max_tokens here
  let response = await result.response;
  let text = response.text();

  // // Update the content of the HTML element with the formatted generated text
  const generatedTextElement = document.getElementById('generatedText');

  function updateCopy() {
    const copyElement = document.getElementById('copyText');

    // Gradually increase opacity
    let opacity = 0;
    const fadeInInterval = setInterval(function () {
      opacity += 0.05; // Increase opacity gradually
      copyElement.style.opacity = opacity;

      if (opacity >= 1) {
        clearInterval(fadeInInterval); // Stop interval when opacity reaches 1
      }
    }, 10); // Adjust the interval time (milliseconds) for smoother animation
  }
  updateCopy();

  // Format the generated C code and output one line at a time
  formatCCode(text, (formattedLine) => {
    const lineElement = document.createElement('div');
    lineElement.textContent = formattedLine;
    generatedTextElement.appendChild(lineElement);
  });

  async function getExplanationFromAI(text, displayCallback) {
    // Initialize GoogleGenerativeAI object with the API key
    const genAI = await initializeGenerativeAI();

    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Construct the prompt for the explanation
    let prompt =
      "'using good grammar and sentance structure, `give me a one to two sentance basic explanation of this code:\n\n" +
      text +
      "'";

    // Generate explanation based on the provided prompt
    let result = await model.generateContent(prompt);
    let response = await result.response;
    let explanation = response.text();

    // Display the generated explanation using the provided callback function
    displayCallback(explanation);
  }
  // Define a function to update the HTML content
  function updateExplanation(content) {
    const explanationElement = document.getElementById('explanation');
    explanationElement.textContent = content;

    // Gradually increase opacity
    let opacity = 0;
    const fadeInInterval = setInterval(function () {
      opacity += 0.05; // Increase opacity gradually
      explanationElement.style.opacity = opacity;

      if (opacity >= 1) {
        clearInterval(fadeInInterval); // Stop interval when opacity reaches 1
      }
    }, 10); // Adjust the interval time (milliseconds) for smoother animation
  }

  // Call the function to get the explanation and update the HTML content
  getExplanationFromAI(text, updateExplanation);

  // Create a function to save text content as a file
  function saveTextAsFile(text, filename) {
    // Create a Blob containing the text content
    const blob = new Blob([text], { type: 'text/plain' });

    // Create a temporary anchor element
    const anchorElement = document.createElement('a');

    // Set the download attribute to specify the filename
    anchorElement.download = filename;

    // Set the href attribute to the Blob object
    anchorElement.href = window.URL.createObjectURL(blob);

    // Trigger a click event on the anchor element
    anchorElement.click();

    // Clean up: remove the anchor element and revoke the URL object
    window.URL.revokeObjectURL(anchorElement.href);
    anchorElement.remove();
  }
  // Function to save text content as a file
  function saveTextAsFile(text, filename) {
    // Replace <div> and </div> tags with newline characters
    text = text.replace(/<\/?div>/g, '\n');

    // Create a Blob containing the text content
    const blob = new Blob([text], { type: 'text/plain' });

    // Create a temporary anchor element
    const anchorElement = document.createElement('a');

    // Set the download attribute to specify the filename
    anchorElement.download = filename;

    // Set the href attribute to the Blob object
    anchorElement.href = window.URL.createObjectURL(blob);

    // Trigger a click event on the anchor element
    anchorElement.click();

    // Clean up: remove the anchor element and revoke the URL object
    window.URL.revokeObjectURL(anchorElement.href);
    anchorElement.remove();
  }
  // Get the download link element
  const downloadLink = document.getElementById('downloadLink');

  // Attach event listener to the download link
  downloadLink.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the default behavior of the <a> tag

    // Get the file name from session storage
    const uploadedFileName = sessionStorage.getItem('uploadedFileName');

    // Construct the file name for download
    const fileName = `${uploadedFileName}.cpp`;

    // Get the text content from the generatedText element without <div> tags
    const generatedTextElement = document.getElementById('generatedText');
    let textContent = generatedTextElement.innerText; // Use innerText to get text content
    textContent = textContent.replace(/&lt;/g, '<').replace(/&gt;/g, '>'); // Revert HTML entities

    // Construct the URL for download
    const downloadURL = `data:text/plain;charset=utf-8,${encodeURIComponent(
      textContent
    )}`;

    // Create a temporary anchor element
    const anchorElement = document.createElement('a');

    // Set the download attribute to specify the filename
    anchorElement.download = fileName;

    // Set the href attribute to the download URL
    anchorElement.href = downloadURL;

    // Trigger a click event on the anchor element
    anchorElement.click();

    // Clean up: remove the anchor element
    anchorElement.remove();
  });

  //save the code to send to refine if needed.
  function passText() {
    const generatedTextElement = document.getElementById('generatedText');
    const generatedTextHTML = generatedTextElement.innerHTML; // Capture HTML content
    // Store HTML content in sessionStorage
    sessionStorage.setItem('generatedTextHTML', generatedTextHTML);
    console.log(generatedTextHTML);
  }

  passText();
}

// Call the run function to start text generation
run();
