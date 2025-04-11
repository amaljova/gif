

document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const browseButton = document.getElementById("browseButton");
  const gifContainer = document.getElementById("gifContainer");
  const gifDisplay = document.getElementById("gifDisplay");
  const controls = document.getElementById("controls");
  const frameSlider = document.getElementById("frameSlider");
  const playPauseButton = document.getElementById("playPauseButton");
  const clearButton = document.getElementById("clearButton");
  const frameCounter = document.getElementById("frameCounter");
  const themeToggle = document.getElementById("themeToggle");

  // App state
  let frames = [];
  let currentFrameIndex = 0;
  let isPlaying = false;
  let animationInterval = null;
  let currentGifUrl = null;
  let frameDelays = [];
  let defaultDelay = 100; // ms

  // Theme management
  function toggleTheme() {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    themeToggle.textContent = isLight ? "Dark Mode" : "Light Mode";
    localStorage.setItem("theme", isLight ? "light" : "dark");
  }

  // Check for saved theme preference
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    themeToggle.textContent = "Dark Mode";
  }

  themeToggle.addEventListener("click", toggleTheme);

  // File handling
  function handleFile(file) {
    if (!file.type.match("image/gif")) {
      alert("Please select a GIF file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const arrayBuffer = new Uint8Array(e.target.result);
      parseGIF(arrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  }

  // Dropzone events
  dropzone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropzone.classList.add("active");
  });

  dropzone.addEventListener("dragleave", function () {
    dropzone.classList.remove("active");
  });

  dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropzone.classList.remove("active");

    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  // Browse button
  browseButton.addEventListener("click", function () {
    fileInput.click();
  });

  fileInput.addEventListener("change", function () {
    if (fileInput.files.length) {
      handleFile(fileInput.files[0]);
    }
  });

  // GIF parsing
  function parseGIF(uint8Array) {
      stopAnimation();

      try {
          const gifReader = new GifReader(uint8Array);
          const width = gifReader.width;
          const height = gifReader.height;

          // Prepare canvas for frame processing
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // Process frames
          frames = [];
          frameDelays = [];
          let previousImageData = null;

          for(let i = 0; i < gifReader.numFrames(); i++) {
              const frameInfo = gifReader.frameInfo(i);
              const imageData = ctx.createImageData(width, height);

              // Decode frame pixels
              gifReader.decodeAndBlitFrameRGBA(i, imageData.data);

              // Handle frame disposal
              if(i > 0) {
                  switch(frameInfo.disposal) {
                      case 2: // Clear to background
                          ctx.clearRect(0, 0, width, height);
                          break;
                      case 3: // Restore to previous
                          if(previousImageData) {
                              ctx.putImageData(previousImageData, 0, 0);
                          }
                          break;
                  }
              }

              // Draw new frame
              ctx.putImageData(imageData, 0, 0);

              // Save frame data
              frames.push(canvas.toDataURL());
              frameDelays.push(frameInfo.delay * 10); // Convert to ms

              // Preserve state if needed
              if(frameInfo.disposal === 3) {
                  previousImageData = ctx.getImageData(0, 0, width, height);
              }
          }

          initializeGIF();
      } catch(e) {
          alert('Error parsing GIF: ' + e.message);
      }
  }

  // function parseGIF(uint8Array) {
  //   stopAnimation();

  //   try {
  //     const gifReader = new GifReader(uint8Array);
  //     const width = gifReader.width;
  //     const height = gifReader.height;

  //     // Create canvas and context
  //     const canvas = document.createElement("canvas");
  //     canvas.width = width;
  //     canvas.height = height;
  //     const ctx = canvas.getContext("2d");

  //     // Simplified background handling
  //     let bgR = 0, bgG = 0, bgB = 0; // Default to black
  //     if (gifReader.globalColorTable?.[gifReader.bgColorIndex]) {
  //       [bgR, bgG, bgB] =
  //         gifReader.globalColorTable[gifReader.bgColorIndex];
  //     }

  //     // Initialize canvas
  //     ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
  //     ctx.fillRect(0, 0, width, height);

  //     // Process frames
  //     frames = [];
  //     frameDelays = [];
  //     let previousState = null;

  //     for (let i = 0; i < gifReader.numFrames(); i++) {
  //       const frameInfo = gifReader.frameInfo(i);
  //       const imageData = ctx.createImageData(width, height);

  //       // Handle disposal
  //       if (i > 0) {
  //         const prevDisposal = gifReader.frameInfo(i - 1).disposal;
  //         if (prevDisposal === 2) {
  //           ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
  //           ctx.fillRect(0, 0, width, height);
  //         } else if (prevDisposal === 3 && previousState) {
  //           ctx.putImageData(previousState, 0, 0);
  //         }
  //       }

  //       // Decode and modify frame
  //       gifReader.decodeAndBlitFrameRGBA(i, imageData.data);
  //       const data = imageData.data;
  //       for (let j = 0; j < data.length; j += 4) {
  //         if (data[j + 3] === 0) {
  //           // Transparent pixels
  //           data[j] = bgR;
  //           data[j + 1] = bgG;
  //           data[j + 2] = bgB;
  //           data[j + 3] = 255;
  //         }
  //       }

  //       // Draw and save
  //       ctx.putImageData(imageData, 0, 0);
  //       frames.push(canvas.toDataURL());
  //       frameDelays.push(frameInfo.delay * 10);

  //       // Store state if needed
  //       previousState =
  //         frameInfo.disposal === 3
  //           ? ctx.getImageData(0, 0, width, height)
  //           : null;
  //     }

  //     initializeGIF();
  //   } catch (e) {
  //     alert(`Error: ${e.message}`);
  //   }
  // }


  // Initialize GIF display
  function initializeGIF() {
    // Show GIF container and controls
    gifContainer.classList.remove("hidden");
    controls.classList.remove("hidden");

    // Setup slider
    frameSlider.max = frames.length - 1;
    frameSlider.value = 0;
    frameSlider.disabled = false;

    // Enable buttons
    playPauseButton.disabled = false;
    clearButton.disabled = false;

    // Display first frame
    updateFrame(0);
  }

  // Update frame display
  function updateFrame(index) {
    if (!frames.length) return;

    // Ensure index is valid
    index = Math.max(0, Math.min(index, frames.length - 1));
    currentFrameIndex = index;

    // Update display
    gifDisplay.src = frames[index];

    // Update slider if not being dragged
    if (!frameSlider.hasAttribute("dragging")) {
      frameSlider.value = index;
    }

    // Update frame counter
    frameCounter.textContent = `Frame: ${index + 1}/${frames.length}`;
  }

  // Frame slider events
  frameSlider.addEventListener("input", function () {
    frameSlider.setAttribute("dragging", "true");
    updateFrame(parseInt(frameSlider.value));
  });

  frameSlider.addEventListener("change", function () {
    frameSlider.removeAttribute("dragging");
    updateFrame(parseInt(frameSlider.value));
  });

  // Play/Pause button
  playPauseButton.addEventListener("click", togglePlayPause);

  function togglePlayPause() {
    if (!frames.length) return;

    if (isPlaying) {
      stopAnimation();
      playPauseButton.textContent = "Play";
    } else {
      startAnimation();
      playPauseButton.textContent = "Pause";
    }

    isPlaying = !isPlaying;
  }

  function startAnimation() {
    if (animationInterval) clearInterval(animationInterval);

    const delay = frameDelays[currentFrameIndex] || 100;
    animationInterval = setInterval(() => {
      const nextFrame = (currentFrameIndex + 1) % frames.length;
      updateFrame(nextFrame);
    }, delay);
  }

  function stopAnimation() {
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = null;
    }
  }

  // Clear button
  clearButton.addEventListener("click", clearGIF);

  function clearGIF() {
    // Stop animation
    stopAnimation();
    isPlaying = false;

    // Reset state
    frames = [];
    currentFrameIndex = 0;
    currentGifUrl = null;
    frameDelays = [];

    // Reset UI
    gifDisplay.src = "";
    gifContainer.classList.add("hidden");
    controls.classList.add("hidden");

    frameSlider.max = 0;
    frameSlider.value = 0;
    frameSlider.disabled = true;

    playPauseButton.disabled = true;
    playPauseButton.textContent = "Play";
    clearButton.disabled = true;

    frameCounter.textContent = "Frame: 0/0";

    // Clear file input
    fileInput.value = "";
  }
});