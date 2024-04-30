<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Upload</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="./gemini_favicon.png" sizes="any" type="image/png" />
    <link rel="stylesheet" href="styles.css" />
    <!-- Link to the CSS file -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" crossorigin="anonymous">
    <style>
        /* Hide the file input */
        #fileToUpload {
            display: none;
        }
    </style>
</head>

<body>
    <div style="float: left; max-width: 80em; min-width: 70vw;">
    <a href="./index.php"
          ><img
            src="devolve.png"
            alt="devolve logo"
            id="logo"
        /></a>
    </div>
    <div class="index">
        <div class="upload">
            <div class="upload-box" id="upload-box">
                <h2 style = "margin-top: 1em">Upload a File</h2>
                <i class="fa-solid fa-upload fa-2x"></i>
                <form id="upload-form" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post" enctype="multipart/form-data">
                    <input type="file" name="fileToUpload" id="fileToUpload">
                    <div for="fileToUpload" id="file-label">Click here or drag and drop a file</div>
                    <input type="submit" value="Upload File" name="submit" id="submit-button" style="display: none;">
                </form >
                <p id="upload-status">
                    <?php
                    $upload_status = "";

                    if (isset($_POST["submit"]) && isset($_FILES["fileToUpload"])) {
                        $target_dir = "./"; // Directory where you want to save the file (current directory)
                        $target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]);

                        if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file)) {
                            // Set file permissions to 777
                            chmod($target_file, 0777);

                            $upload_status = "The file " . basename($_FILES["fileToUpload"]["name"]) . " has been uploaded.";
                            // Execute the shell script and capture its output
                            $output = shell_exec("objdump -d " . escapeshellarg($target_file) . " > output.txt");

                            // Display results
                            echo "<pre>$output</pre>";

                            // Redirect to gemini.html
                            header("Location: ./gemini.html");
                            exit();
                        } else {
                            $upload_status = "Sorry, there was an error uploading your file.";
                        }
                    }
                    echo $upload_status;
                    ?>
                </p>
            </div>
        </div>
        <div class="menu" style="margin-left: -10em">
            <a href="./index.php" class="menu-item current-page">Upload</a>
            <span class="arrow"><i class="fas fa-arrow-down"></i></span>
            <a href="#" class="menu-item">Assembly</a>
            <span class="arrow"><i class="fas fa-arrow-down"></i></span>
            <a href="./gemini.html" class="menu-item">Devolve</a>
            <span class="arrow"><i class="fas fa-arrow-down"></i></span>
            <a href="#" class="menu-item">Refine</a>
            <span class="arrow"><i class="fas fa-arrow-down"></i></span>
            <a href="#" class="menu-item">Download</a>
        </div>
    </div>

    <script>
    const uploadBox = document.getElementById('upload-box');
    const fileInput = document.getElementById('fileToUpload');
    const fileLabel = document.getElementById('file-label');
    const submitButton = document.getElementById('submit-button');

    uploadBox.addEventListener('click', () => {
        if (!fileInput.files.length) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileLabel.textContent = `${fileInput.files[0].name}`;
            submitButton.style.display = 'block'; // Show the submit button
        } else {
            fileLabel.textContent = 'Click here or drag and drop a file';
        }
    });

    uploadBox.addEventListener('dragover', (event) => {
        event.preventDefault();
        uploadBox.classList.add('dragover');
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('dragover');
    });

    uploadBox.addEventListener('drop', (event) => {
        event.preventDefault();
        uploadBox.classList.remove('dragover');
        fileInput.files = event.dataTransfer.files;
        if (fileInput.files.length > 0) {
            fileLabel.textContent = `${fileInput.files[0].name}`;
            submitButton.style.display = 'block'; // Show the submit button
        }
    });

    submitButton.addEventListener('click', () => {
        document.getElementById('upload-form').submit();
    });
</script>
<script>
    function saveFileNameWithoutExtension() {
        const fileInput = document.getElementById('fileToUpload');
        const uploadedFileName = fileInput.files[0].name;
        const filenameWithoutExtension = uploadedFileName.split('.').slice(0, -1).join('.');
        sessionStorage.setItem('uploadedFileName', filenameWithoutExtension);
    }

    document.getElementById('submit-button').addEventListener('click', saveFileNameWithoutExtension);
</script>


</body>
</html>
