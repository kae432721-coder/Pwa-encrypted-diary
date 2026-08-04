// --- GOOGLE CLOUD CONFIG ---
const GOOGLE_CLIENT_ID = "697780392985-iejrson8bir2ol3dvdngipg66k9ni0hs.apps.googleusercontent.com"; 

// --- GLOBAL STATE VARIABLES ---
let gDriveToken = null;
let gDriveFileId = null;
let activeKey = null;
let isCloudReady = false; 

let sanctuaryData = {
  journal: [],
  codex: [], 
  lists: [],
  thoughts: [] 
};

// --- CRYPTOGRAPHY ENGINE (AES-GCM 256) ---
async function getCryptoKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
}

async function encryptText(text, key) {
  if (!text || !key) return text;
  try {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cryptoKey = await getCryptoKey(key, salt);
    const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, cryptoKey, enc.encode(text));
    
    const packed = new Uint8Array(salt.byteLength + iv.byteLength + encryptedBuffer.byteLength);
    packed.set(salt, 0);
    packed.set(iv, salt.byteLength);
    packed.set(new Uint8Array(encryptedBuffer), salt.byteLength + iv.byteLength);
    return "ENC:" + btoa(String.fromCharCode(...packed));
  } catch (err) {
    console.error("Encryption error:", err);
    return text;
  }
}

async function decryptText(packedBase64, key) {
  if (!packedBase64 || !key) return packedBase64;
  if (!packedBase64.startsWith("ENC:")) return packedBase64; 
  
  try {
    const binaryStr = atob(packedBase64.replace(/^ENC:/, ""));
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const ciphertext = bytes.slice(28);

    const cryptoKey = await getCryptoKey(key, salt);
    const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, cryptoKey, ciphertext);
    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    throw new Error("DECRYPTION_FAILED");
  }
}

// --- IMAGE COMPRESSOR & BASE64 ENCODER ---
window.compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; 
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
    reader.onerror = error => reject(error);
  });
};

// --- GOOGLE DRIVE SYNC ENGINE ---
const findDriveFile = async () => {
  const res = await fetch("https://www.googleapis.com/drive/v3/files?q=name='sanctuary_os.json' and trashed=false", { 
    headers: { Authorization: `Bearer ${gDriveToken}` } 
  });
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
};

const createDriveFile = async (contentStr) => {
  const metaRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: 'POST', 
    headers: { 'Authorization': `Bearer ${gDriveToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'sanctuary_os.json' })
  });
  const metaData = await metaRes.json();
  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${metaData.id}?uploadType=media`, {
    method: 'PATCH', 
    headers: { 'Authorization': `Bearer ${gDriveToken}`, 'Content-Type': 'application/json' },
    body: contentStr
  });
  return metaData.id;
};

window.pushToDrive = async () => {
  if (!gDriveToken || !isCloudReady) return; 
  const indicator = document.getElementById('cloud-indicator');
  
  try {
    if (indicator) indicator.innerText = "Status: Syncing...";
    const encryptedPayload = await encryptText(JSON.stringify(sanctuaryData), activeKey);
    const contentStr = JSON.stringify({ payload: encryptedPayload });

    if (!gDriveFileId) {
      gDriveFileId = await createDriveFile(contentStr);
    } else {
       const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${gDriveFileId}?uploadType=media`, {
          method: 'PATCH', 
          headers: { Authorization: `Bearer ${gDriveToken}`, 'Content-Type': 'application/json' }, 
          body: contentStr
       });
       if (!res.ok) throw new Error("Drive upload failed");
    }
    if (indicator) indicator.innerText = "Status: Synced";
  } catch (err) {
    if (indicator) indicator.innerText = "Status: Sync Failed";
    console.error("Push Error:", err);
  }
};

const pullFromDrive = async () => {
  if (!gDriveToken || !gDriveFileId) return;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${gDriveFileId}?alt=media`, { 
    headers: { Authorization: `Bearer ${gDriveToken}` } 
  });
  
  if (res.ok) {
    const content = await res.json();
    if (content.payload) {
      const decryptedString = await decryptText(content.payload, activeKey);
      sanctuaryData = { ...sanctuaryData, ...JSON.parse(decryptedString) };
    }
  }
};

// --- MASTER KEY CHANGE LOGIC (New Settings Page Layout) ---
const btnConfirmKeyChange = document.getElementById('btn-confirm-key-change');
if(btnConfirmKeyChange) {
  btnConfirmKeyChange.addEventListener('click', async () => {
    const oldKey = document.getElementById('old-key').value.trim();
    const newKey = document.getElementById('new-key').value.trim();
    const newKeyConfirm = document.getElementById('new-key-confirm').value.trim();
    
    if (oldKey !== activeKey) { alert("Current Key is incorrect."); return; }
    if (!newKey || newKey !== newKeyConfirm) { alert("New keys do not match."); return; }
    
    btnConfirmKeyChange.innerText = "Re-encrypting Vault...";
    btnConfirmKeyChange.disabled = true;

    try {
      activeKey = newKey;
      await window.pushToDrive();
      alert("Master Key successfully changed. Your vault has been re-encrypted.");
      document.getElementById('old-key').value = '';
      document.getElementById('new-key').value = '';
      document.getElementById('new-key-confirm').value = '';
    } catch (err) {
      alert("Failed to change key. Connection error.");
      activeKey = oldKey; // Revert on failure
    }
    btnConfirmKeyChange.innerText = "Re-Encrypt Vault";
    btnConfirmKeyChange.disabled = false;
  });
}

// --- AUTHENTICATION FLOW ---
let tokenClient;

window.onload = function () {
  // Ensure the Google Identity Script has loaded before initializing
  if (window.google && google.accounts) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
      callback: async (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          gDriveToken = tokenResponse.access_token;
          
          try {
            const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
               headers: { Authorization: `Bearer ${gDriveToken}` }
            });
            const userData = await userRes.json();
            document.getElementById('user-email-display').innerText = `Identity Verified: ${userData.email}`;
          } catch(e) {
            document.getElementById('user-email-display').innerText = `Secure Connection Established.`;
          }
          
          document.getElementById('step-google').classList.add('hidden');
          document.getElementById('step-password').classList.remove('hidden');
          document.getElementById('diary-password').focus();
        }
      }
    });
  } else {
    console.error("Google Identity Services script not loaded.");
  }
};

const btnGoogleLogin = document.getElementById('btn-google-login');
if(btnGoogleLogin) {
  btnGoogleLogin.addEventListener('click', () => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      alert("Google Secure Login is still initializing or was blocked by your browser. Ensure you are running on localhost.");
    }
  });
}

const btnUnlock = document.getElementById('btn-unlock');
if(btnUnlock) {
  btnUnlock.addEventListener('click', async () => {
    const passInput = document.getElementById('diary-password');
    const pass = passInput.value.trim();
    if (!pass) return;
    
    activeKey = pass;
    btnUnlock.innerText = "Verifying Vault...";
    btnUnlock.disabled = true;

    try {
      gDriveFileId = await findDriveFile();
      
      if (gDriveFileId) {
        await pullFromDrive();
      } else {
        isCloudReady = true; 
        await window.pushToDrive();
      }
      
      isCloudReady = true; 
      
      document.getElementById('auth-screen').classList.add('hidden');
      document.getElementById('quote-screen').classList.remove('hidden');
      
      window.dispatchEvent(new Event('cloudDataLoaded'));
      
    } catch (err) {
      if (err.message === "DECRYPTION_FAILED") {
        alert("Incorrect key for this sanctuary.");
        passInput.value = "";
      } else {
        alert("Network error establishing secure connection.");
        console.error(err);
      }
      btnUnlock.innerText = "Unlock Vault";
      btnUnlock.disabled = false;
    }
  });
}
