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

// Function to generate text and update HTML content
async function run() {
  // Fetch the contents of the output.txt file
  const outputText = await getFileContents('output.txt');
  const generatedTextElement = document.getElementById('generatedText');

  // Display the fetched text in the generatedText element
  generatedTextElement.textContent = outputText;
}

// Call the run function to start text generation
run();

async function getExplanationFromAI(text, displayCallback) {
  // Initialize GoogleGenerativeAI object with the API key
  const genAI = await initializeGenerativeAI();

  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  // Construct the prompt for the explanation
  let prompt =
    "'In 100 characters or less, tell me a bit about this assembly code:\n\n" +
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
    opacity += 0.1; // Increase opacity gradually
    explanationElement.style.opacity = opacity;

    if (opacity >= 1) {
      clearInterval(fadeInInterval); // Stop interval when opacity reaches 1
    }
  }, 50); // Adjust the interval time (milliseconds) for smoother animation
}

// Call the function to get the explanation and update the HTML content
let input = await getFileContents('output.txt');
getExplanationFromAI(input, updateExplanation);

// Get the download link element
const downloadLink = document.getElementById('downloadLink');

// Attach event listener to the download link
downloadLink.addEventListener('click', (event) => {
  event.preventDefault(); // Prevent the default behavior of the <a> tag

  // Get the file name from session storage
  const uploadedFileName = sessionStorage.getItem('uploadedFileName');

  // Construct the file name for download
  const fileName = `${uploadedFileName}.asm`;

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

// Call the run function to start text generation
run();
