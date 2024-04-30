// Import GoogleGenerativeAI module
import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai';

// Function to fetch the contents of a file
async function getFileContents(filename) {
  const response = await fetch(filename);
  const text = await response.text();
  return text;
}

function showLoader() {
  var loader = document.createElement('div');
  loader.className = 'loader';
  document.body.appendChild(loader);
}

function hideLoader() {
  var loader = document.querySelector('.loader');
  if (loader) {
    loader.remove();
  }
}

// Update the content of the HTML element with the formatted generated text
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

// Initialize GoogleGenerativeAI object with your API key
async function initializeGenerativeAI() {
  // Fetch API key from api_key.txt
  const key = await getFileContents('api_key.txt');
  const API_KEY = key.trim(); // Remove leading/trailing whitespace

  // Return the initialized GoogleGenerativeAI object
  return new GoogleGenerativeAI(API_KEY);
}

// Retrieve the stored HTML content from sessionStorage
const storedHTML = sessionStorage.getItem('generatedTextHTML');

// Check if there is stored HTML content
// Retrieve the stored HTML content from sessionStorage after page load
window.onload = function () {
  const storedHTML = sessionStorage.getItem('generatedTextHTML');
  if (storedHTML) {
    document.getElementById('generatedText').innerHTML = storedHTML;
  } else {
    console.log('No stored HTML content found.');
  }
};

var loader = document.querySelector('.loader');

// Check if the loader element exists
if (loader) {
  // Set the opacity to 1 to make the loader fully visible
  hideLoader();
} else {
  console.error('Loader element not found.');
}

// Function to generate text and update HTML content
async function run() {
  let outputText = document.getElementById('generatedText').textContent;
  let changes = document.getElementById('inputText').value;
  // Retrieve the outputText element

  // Get the generatedTextElement
  const generatedTextElement = document.getElementById('generatedText');

  // Clear the generatedTextElement
  generatedTextElement.innerHTML = ''; // Clear the content
  // Check if the loader element exists
  if (loader) {
    // Set the opacity to 1 to make the loader fully visible
    showLoader();
  } else {
    console.error('Loader element not found.');
  }

  // Initialize GoogleGenerativeAI object with the API key
  const genAI = await initializeGenerativeAI();

  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  // Construct the prompt by concatenating outputText with additional prompt text
  let prompt =
    "'DO NOT INCLUDE BACKTICKS IN THE RESPONSE. PROVIDE ONLY CODE IN YOUR RESPONSE, NO OTHER TEXT.  - make the following changes to the code below:" +
    changes +
    '\n\n' +
    outputText +
    'DO NOT INCLUDE BACKTICKS OR LANGUAGE NAME IN THE RESPONSE. BE SURE TO INCLUDE NECESSARY LIBRARIES. ALWAYS GIVE BACK ENTIRE CODE WITH CHANGES, NOT JUST THE CHANGES';
  console.log('prompt1: ', prompt);
  let result = await model.generateContent(prompt); // Specify max_tokens here
  let response = await result.response;
  let text = response.text();

  function removeLinesStartingWithPrefix(text, prefix) {
    // Create a regular expression to match lines starting with the prefix
    var regex = new RegExp('^' + prefix + '.*$', 'gm');

    // Replace lines starting with the prefix with an empty string
    var result = text.replace(regex, '');

    return result;
  }

  text = removeLinesStartingWithPrefix(text, '`');

  let iconElement = document.getElementById('copyID');
  iconElement.classList.remove('copyIconClicked');
  iconElement.classList.add('copyIcon');

  generatedTextElement.textContent = text;
  // Check if the loader element exists
  if (loader) {
    // Set the opacity to 1 to make the loader fully visible
    hideLoader();
  } else {
    console.error('Loader element not found.');
  }

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

  // Save the code to send to refine if needed
  function passText() {
    const generatedText = document.getElementById('generatedText').textContent;
    // Store text in sessionStorage
    sessionStorage.setItem('generatedText', generatedText);
  }

  passText();
}

// Add an event listener to the submit button
document.getElementById('submitBtn').addEventListener('click', function () {
  run(); // Call the run() function when the button is clicked
});
