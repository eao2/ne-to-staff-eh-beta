<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const scannerContainer = ref(null);
const scannedBarcode = ref(null);
const manualBarcodeInput = ref("");
const cargoType = ref("NORMAL");
const scannerActive = ref(false);
const errorMessage = ref("");
const statusMessage = ref("正在启动扫描仪...");
const recentlyScanned = ref([]);
const debugInfo = ref("");
const zoomLevel = ref(1);
let videoStream = null;
let barcodeDetector = null;
let detectionInterval = null;

const setZoom = async (level) => {
  try {
    if (!videoStream) return;
    const videoTrack = videoStream.getVideoTracks()[0];
    await videoTrack.applyConstraints({
      advanced: [{
        zoom: level
      }]
    });
    zoomLevel.value = level;
  } catch (error) {
    console.error("Error setting zoom:", error);
  }
};

const startScanner = async () => {
  try {
    errorMessage.value = "";
    statusMessage.value = "正在启动扫描仪...";
    
    if (!scannerContainer.value) {
      console.error("Scanner container not found");
      errorMessage.value = "Scanner container not found";
      return;
    }

    // Check if BarcodeDetector is supported
    if (!('BarcodeDetector' in window)) {
      errorMessage.value = "Barcode detection is not supported in this browser";
      statusMessage.value = "Please use a modern browser that supports barcode detection";
      return;
    }

    // Create video element if it doesn't exist
    let video = scannerContainer.value.querySelector('video');
    if (!video) {
      video = document.createElement('video');
      video.setAttribute('playsinline', ''); // Required for iOS
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      scannerContainer.value.appendChild(video);
    }

    // Initialize BarcodeDetector with common 1D formats
    barcodeDetector = new BarcodeDetector({
      formats: [
        'code_128',
        'code_39',
        'code_93',
        'codabar',
        'ean_13',
        'ean_8',
        'upc_a',
        'upc_e',
        'itf'
      ]
    });

    // Get camera stream with optimized settings
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 2048 }, // Reduced from 4096
        height: { ideal: 1536 }, // 4:3 aspect ratio
        aspectRatio: { ideal: 4/3 },
        frameRate: { ideal: 30, max: 30 },
        advanced: [{
          zoom: zoomLevel.value, // Use dynamic zoom level
          brightness: { ideal: 128 },
          contrast: { ideal: 128 },
          exposureMode: 'continuous',
          focusMode: 'continuous'
        }]
      }
    });

    videoStream = stream;
    video.srcObject = stream;
    await video.play();
    scannerActive.value = true;
    statusMessage.value = "请将条形码对准中心位置...";

    // Track processed codes to avoid duplicates
    const recentlySent = new Set();

    // Start continuous detection with reduced frequency
    detectionInterval = setInterval(async () => {
      try {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const barcodes = await barcodeDetector.detect(video);
          
          for (const barcode of barcodes) {
            const { format, rawValue: code } = barcode;
            debugInfo.value = `Detected: ${code} (${format})`;

            // Only process if we haven't recently detected this code
            if (!recentlySent.has(code)) {
              recentlySent.add(code);
              // Clear from recent list after 3 seconds
              setTimeout(() => {
                recentlySent.delete(code);
              }, 3000);

              // Store the detected barcode
              manualBarcodeInput.value = code;
              statusMessage.value = `检测到 ${format} 条形码: ${code}. 点击"设为在途"登记`;

              // Visual feedback
              document.querySelector('.scanner-view').classList.add('detected');
              setTimeout(() => {
                document.querySelector('.scanner-view').classList.remove('detected');
              }, 300);
            }
          }
        }
      } catch (error) {
        console.error("Detection error:", error);
        debugInfo.value = `Detection error: ${error.message}`;
      }
    }, 150); // Reduced from 100ms to 150ms for better performance

  } catch (error) {
    console.error("Error starting scanner:", error);
    errorMessage.value = `Failed to start scanner: ${error.message || 'Unknown error'}`;
    debugInfo.value += `\nError: ${error.message || 'Unknown error'}`;
    scannerActive.value = false;
    statusMessage.value = "扫描仪初始化失败";
  }
};

const pauseScanner = () => {
  if (scannerActive.value) {
    try {
      if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
      }
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
      }
      scannerActive.value = false;
      statusMessage.value = "扫描仪已暂停";
    } catch (error) {
      console.error("Error stopping scanner:", error);
    }
  }
};

const resetScanner = () => {
  pauseScanner();
  scannedBarcode.value = null;
  errorMessage.value = "";
  setTimeout(() => {
    startScanner();
  }, 500);
};

const sendBarcodeToAPI = async (barcode) => {
  try {
    if (!barcode) {
      errorMessage.value = "请输入跟踪号码";
      return;
    }
    
    statusMessage.value = `发送跟踪号码: ${barcode}...`;
    const response = await fetch("/api/cargo/set-in-transit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        barcode,
        cargoType: cargoType.value 
      }),
    });
    
    if (response.status === 409) {
      const data = await response.json();
      errorMessage.value = data.message;
      statusMessage.value = "Already in transit";
      manualBarcodeInput.value = ""; // Clear input
      return;
    }
    
    if (response.status === 404) {
      throw new Error("Cargo not found. Please register it at Erenhot first.");
    }
    
    if (response.status === 400) {
      const data = await response.json();
      throw new Error(data.message);
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("API response:", data);
    
    // Add to recent scans list
    recentlyScanned.value.unshift({
      code: barcode,
      status: 'IN_TRANSIT',
      time: new Date().toLocaleTimeString()
    });
    
    // Keep only last 5 scans
    if (recentlyScanned.value.length > 5) {
      recentlyScanned.value.pop();
    }
    
    statusMessage.value = `Barcode ${barcode} set to IN_TRANSIT successfully`;
    manualBarcodeInput.value = ""; // Clear input after successful send
  } catch (error) {
    console.error("Error sending barcode:", error);
    errorMessage.value = `API error: ${error.message}`;
    statusMessage.value = "API request failed";
  }
};

const sendManualBarcode = () => {
  if (manualBarcodeInput.value.trim()) {
    sendBarcodeToAPI(manualBarcodeInput.value.trim());
  }
};

const revertInTransit = async (barcode) => {
  try {
    if (!barcode) {
      errorMessage.value = "No barcode to revert";
      return;
    }
    
    statusMessage.value = `Reverting barcode: ${barcode} status...`;
    const response = await fetch("/api/cargo/revert-in-transit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode }),
    });
    
    if (response.status === 404) {
      throw new Error("Cargo not found");
    }
    
    if (response.status === 400) {
      throw new Error("Can only revert IN_TRANSIT status");
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("API response:", data);
    
    // Add to recent scans list
    recentlyScanned.value.unshift({
      code: barcode,
      status: 'REVERTED',
      time: new Date().toLocaleTimeString()
    });
    
    // Keep only last 5 scans
    if (recentlyScanned.value.length > 5) {
      recentlyScanned.value.pop();
    }
    
    statusMessage.value = `Barcode ${barcode} reverted to RECEIVED_AT_ERENHOT successfully`;
    manualBarcodeInput.value = ""; // Clear input after successful revert
  } catch (error) {
    console.error("Error reverting barcode:", error);
    errorMessage.value = `API error: ${error.message}`;
    statusMessage.value = "API request failed";
  }
};

// Start scanner when component is mounted
onMounted(() => {
  console.log("Component mounted, initializing scanner");
  setTimeout(() => {
    startScanner();
  }, 1000);
});

// Clean up when component is unmounted
onUnmounted(() => {
  pauseScanner();
});

// Handle window visibility changes
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    if (!scannerActive.value) {
      console.log("Page visible again, restarting scanner");
      setTimeout(() => startScanner(), 500);
    }
  } else if (scannerActive.value) {
    console.log("Page hidden, pausing scanner");
    pauseScanner();
  }
};

// Mount visibility change handler
onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

// Clean up visibility change handler
onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<template>
  <div class="mobile-container">
    <TopNavigation />
    
    <div class="content">
      <!-- Add zoom controls -->
      <div class="zoom-controls">
        <button 
          @click="setZoom(1)" 
          :class="{ active: zoomLevel === 1 }"
          class="zoom-btn"
        >1x</button>
        <button 
          @click="setZoom(1.5)" 
          :class="{ active: zoomLevel === 1.5 }"
          class="zoom-btn"
        >1.5x</button>
        <button 
          @click="setZoom(2)" 
          :class="{ active: zoomLevel === 2 }"
          class="zoom-btn"
        >2x</button>
      </div>

      <!-- Add cargo type selection -->
      <div class="form-grid">
        <div class="form-group">
          <label>货物类型:</label>
          <div class="cargo-type-options">
            <input 
              type="radio" 
              id="normal" 
              value="NORMAL" 
              v-model="cargoType"
              name="cargoType"
            />
            <label class="radio-box" for="normal">
              <span class="radio-label">普通 (速)</span>
            </label>

            <input 
              type="radio" 
              id="quick" 
              value="QUICK" 
              v-model="cargoType"
              name="cargoType"
            />
            <label class="radio-box" for="quick">
              <span class="radio-label">加急 (S)</span>
            </label>
          </div>
        </div>
      </div>

      <div class="scanner-view" :class="{ 'active': scannerActive }">
        <div ref="scannerContainer" class="video-container">
          <!-- Video element will be inserted here -->
        </div>
        <div class="overlay">
          <div class="target-box"></div>
          <div class="scanning-line"></div>
        </div>
      </div>
      
      <div class="status-bar">
        <p>{{ statusMessage }}</p>
        <p v-if="debugInfo" class="debug-info">{{ debugInfo }}</p>
      </div>
      
      <div class="controls">
        <!-- Manual barcode input with send button only -->
        <div class="manual-input">
          <input 
            type="text" 
            v-model="manualBarcodeInput" 
            placeholder="请输入跟踪号码" 
            @keyup.enter="sendManualBarcode"
          />
          <button @click="sendManualBarcode" class="btn-submit">设为在途</button>
        </div>
        
        <!-- Recent scans list -->
        <div v-if="recentlyScanned.length > 0" class="recent-list">
          <h3>最近扫描:</h3>
          <table class="cargos-table">
            <thead>
              <tr>
                <th>跟踪号码</th>
                <th>状态</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in recentlyScanned" :key="index">
                <td>{{ item.code }}</td>
                <td>{{ item.status === 'IN_TRANSIT' ? '在途中' : '已退回' }}</td>
                <td>{{ item.time }}</td>
                <td>
                  <button 
                    v-if="item.status === 'IN_TRANSIT'"
                    @click="revertInTransit(item.code)" 
                    class="btn-warning btn-small"
                  >
                    退回
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        
        <div class="buttons">
          <button @click="resetScanner" class="btn-edit">重新启动</button>
          <button v-if="!scannerActive" @click="startScanner" class="btn-submit">开启相机</button>
          <button v-else @click="pauseScanner" class="btn-edit">关闭相机</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mobile-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.content {
  padding-top: 50px; // Space for fixed navigation
  padding: 60px 16px 16px;
}

// Scanner styles
.scanner-view {
  position: relative;
  margin-bottom: 16px;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  height: 40vh;
  max-height: 320px;
  transition: all 0.3s ease;

  &.detected {
    background-color: #4CAF50;
  }

  &.active {
    border: 2px solid #4CAF50;
  }
}

.video-container {
  width: 100%;
  height: 100%;

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  .target-box {
    position: absolute;
    top: 25%;
    left: 10%;
    width: 80%;
    height: 50%;
    border: 2px solid rgba(76, 175, 80, 0.8);
    border-radius: 8px;
    box-sizing: border-box;
  }

  .scanning-line {
    position: absolute;
    left: 10%;
    width: 80%;
    height: 2px;
    background-color: red;
    animation: scan 2s linear infinite;
  }
}

@keyframes scan {
  0% { top: 25%; }
  50% { top: 75%; }
  100% { top: 25%; }
}

// Status and controls
.status-bar {
  background-color: #fff;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.debug-info {
  font-family: monospace;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.manual-input {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  input {
    flex: 1;
    height: 40px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    padding: 8px 12px;
    font-size: 16px;
  }
}

// Table styles
.cargos-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;

  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
    font-size: 14px;
  }

  th {
    font-weight: 500;
    background-color: #f5f5f5;
  }
}

// Button styles
.btn-submit, .btn-edit {
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-submit {
  background-color: #1a73e8;
  color: white;

  &:active {
    background-color: rgba(26, 115, 232, 0.8);
  }
}

.btn-edit {
  background-color: #f5f5f5;
  color: #1a73e8;

  &:active {
    background-color: rgba(245, 245, 245, 0.8);
  }
}

.buttons {
  display: flex;
  gap: 8px;
}

.error {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

// Recent scans
.recent-list {
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;

  h3 {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 500;
  }
}

// Add new warning button style
.btn-warning {
  background-color: #ff9800;
  color: white;

  &:active {
    background-color: rgba(255, 152, 0, 0.8);
  }
}

.btn-small {
  height: 32px;
  padding: 0 8px;
  font-size: 12px;
}

// Add zoom controls styles
.zoom-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  .zoom-btn {
    height: 40px;
    padding: 0 16px;
    border-radius: 8px;
    border: none;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    background-color: #f5f5f5;
    color: #1a73e8;
    transition: all 0.2s;

    &.active {
      background-color: #1a73e8;
      color: white;
    }

    &:active {
      background-color: rgba(245, 245, 245, 0.8);
    }
  }
}

// Add form styles
.form-grid {
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-weight: 500;
    color: #202124;
  }
}

.cargo-type-options {
  display: flex;
  gap: 8px;

  input[type="radio"] {
    display: none;
    &:checked + .radio-box {
      color: #fff;
      background-color: #1a73e8;
    }
  }

  .radio-box {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    height: 2.5rem;
    background-color: #fff;
    border: 1px solid #e0e0e0;
    
    .radio-label {
      display: block;
      text-align: center;
      font-weight: 500;
    }
  }
}
</style>