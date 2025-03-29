(function () {
  // Insert loader HTML
  document.write(`
    <style>
      #wasm-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #282828;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: sans-serif;
      }
      
      .loader-content {
        text-align: center;
      }
      
      #wasm-loader-logo {
        width: 80px;
        height: auto;
        margin-bottom: 20px;
      }
      
      #wasm-loader h2 {
        color: #458588;
        margin-bottom: 15px;
      }
      
      #wasm-progress {
        width: 250px;
        height: 10px;
        margin-top: 15px;
        -webkit-appearance: none;
        appearance: none;
      }
      
      #wasm-progress::-webkit-progress-bar {
        background-color: #444;
        border-radius: 5px;
      }
      
      #wasm-progress::-webkit-progress-value {
        background-color: #d79921;
        border-radius: 5px;
      }
      
      #wasm-progress::-moz-progress-bar {
        background-color: #d79921;
        border-radius: 5px;
      }
      
      #wasm-status {
        margin-top: 12px;
        font-size: 14px;
        color: #d65d0e;
      }
      
      #wasm-first-load-note {
        margin-top: 15px;
        font-size: 12px;
        color: #928374;
        max-width: 300px;
      }
    </style>
    
    <div id="wasm-loader">
      <div class="loader-content">
        <img id="wasm-loader-logo" src="/logo.svg" alt="Bappa Logo">
        <h2>Loading WebAssembly</h2>
        <progress id="wasm-progress" max="100" value="10"></progress>
        <div id="wasm-status">Downloading...</div>
<div id="wasm-first-load-note">First-time loads take longer while your browser downloads and compiles the WebAssembly code. Future visits will be faster as your browser can use cached resources.</div>
      </div>
    </div>
  `);

  // Store the original instantiateStreaming function
  const originalInstantiateStreaming = WebAssembly.instantiateStreaming;

  // Override the instantiateStreaming function to add progress tracking
  WebAssembly.instantiateStreaming = function (fetchPromise, importObject) {
    const loader = document.getElementById('wasm-loader');
    const progress = document.getElementById('wasm-progress');
    const status = document.getElementById('wasm-status');

    // Set initial state
    progress.value = 10;
    status.textContent = "Downloading WebAssembly...";

    const startTime = performance.now();

    // When fetch completes, update to compiling state
    fetchPromise.then(() => {
      progress.value = 40;
      status.textContent = "Compiling WebAssembly (this may take a while)...";
    });

    // Call the original function
    return originalInstantiateStreaming(fetchPromise, importObject)
      .then(result => {
        const endTime = performance.now();
        const loadTime = ((endTime - startTime) / 1000).toFixed(1);

        progress.value = 90;
        status.textContent = `Initializing (loaded in ${loadTime}s)...`;

        // Show complete for a moment before hiding
        setTimeout(() => {
          progress.value = 100;
          status.textContent = "Complete!";

          // Hide loader after a short delay
          setTimeout(() => {
            loader.style.display = 'none';
          }, 300);
        }, 200);

        return result;
      })
      .catch(err => {
        // Show error in loader
        loader.innerHTML = `
          <div class="loader-content">
            <img id="wasm-loader-logo" src="/logo.svg" alt="Bappa Logo">
            <h2 style="color: #cc241d;">Error Loading WebAssembly</h2>
            <p style="color: #d65d0e;">There was a problem loading the application.</p>
            <p style="color: #d79921;">Please refresh the page to try again.</p>
            <p style="font-size: 12px; color: #928374; margin-top: 20px;">${err.message}</p>
          </div>
        `;
        console.error("WebAssembly loading failed:", err);
        throw err;
      });
  };
})();
