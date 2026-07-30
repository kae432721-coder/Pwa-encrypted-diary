// --- ⚠️ GOOGLE CLOUD CONFIG ⚠️ ---
// This is your specific Client ID for Google Identity Services
const GOOGLE_CLIENT_ID = "697780392985-iejrson8bir2ol3dvdngipg66k9ni0hs.apps.googleusercontent.com"; 

// --- GLOBAL STATE VARIABLES ---
// These are accessed by modules.js to render your UI
let gDriveToken = null;
let gDriveFileId = null;
let activeKey = null;
let isCloudReady = false; 

// The Master Data Structure of your Sanctuary
let sanctuaryData = {
  journal: [],
  people: [],
  lists: [],
  quotes: []
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
    throw new Error("DECRYPTION_FAILED"); // Triggered if password is wrong
  }
}

// --- GOOGLE DRIVE SYNC ENGINE ---
const findDriveFile = async () => {
  const res = await fetch("https://www.googleapis.com/drive/v3/files?q=name='my_sanctuary.json' and trashed=false", { 
    headers: { Authorization: `Bearer ${gDriveToken}` } 
  });
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
};

const createDriveFile = async (contentStr) => {
  const metaRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: 'POST', 
    headers: { 'Authorization': `Bearer ${gDriveToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'my_sanctuary.json' })
  });
  const metaData = await metaRes.json();
  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${metaData.id}?uploadType=media`, {
    method: 'PATCH', 
    headers: { 'Authorization': `Bearer ${gDriveToken}`, 'Content-Type': 'application/json' },
    body: contentStr
  });
  return metaData.id;
};

// Exposed globally so modules.js can call it when data changes
window.pushToDrive = async () => {
  if (!gDriveToken || !isCloudReady) return; // STRICT LOCK: Prevents overwriting with empty data
  const indicator = document.getElementById('cloud-indicator');
  
  try {
    indicator.innerText = "Cloud: Syncing...";
    // Encrypt the entire data structure into one secure payload
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
    indicator.innerText = "Cloud: Synced";
  } catch (err) {
    indicator.innerText = "Cloud: Sync Failed";
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
      // Merge with the default structure to ensure missing arrays (like new features) don't break the app
      sanctuaryData = { ...sanctuaryData, ...JSON.parse(decryptedString) };
    }
  }
};

// --- AUTHENTICATION FLOW ---
let tokenClient;

window.onload = function () {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
    callback: async (tokenResponse) => {
      if (tokenResponse && tokenResponse.access_token) {
        gDriveToken = tokenResponse.access_token;
        
        // Fetch User Email to personalize the password screen
        try {
          const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
             headers: { Authorization: `Bearer ${gDriveToken}` }
          });
          const userData = await userRes.json();
          document.getElementById('user-email-display').innerText = `Welcome, ${userData.email}`;
        } catch(e) {
          document.getElementById('user-email-display').innerText = `Secure Connection Established.`;
        }
        
        // Advance UI to Password Step
        document.getElementById('step-google').classList.add('hidden');
        document.getElementById('step-password').classList.remove('hidden');
        document.getElementById('diary-password').focus();
      }
    }
  });
};

document.getElementById('btn-google-login').addEventListener('click', () => {
  tokenClient.requestAccessToken();
});

document.getElementById('btn-unlock').addEventListener('click', async () => {
  const passInput = document.getElementById('diary-password');
  const pass = passInput.value.trim();
  if (!pass) return;
  
  activeKey = pass;
  const btn = document.getElementById('btn-unlock');
  btn.innerText = "Verifying Vault...";
  btn.disabled = true;

  try {
    gDriveFileId = await findDriveFile();
    
    if (gDriveFileId) {
      // File exists, securely download and decrypt it
      await pullFromDrive();
    } else {
      // First time setup: push empty structure to create file
      isCloudReady = true; 
      await window.pushToDrive();
    }
    
    // If we reach here, decryption succeeded or it is a brand new account.
    isCloudReady = true; // STRICT LOCK RELEASED
    
    // Advance UI to Quote Screen
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('quote-screen').classList.remove('hidden');
    
    // Dispatch a custom event to tell modules.js that the data is ready to be rendered
    window.dispatchEvent(new Event('cloudDataLoaded'));
    
  } catch (err) {
    if (err.message === "DECRYPTION_FAILED") {
      alert("Incorrect key for this sanctuary.");
      passInput.value = "";
    } else {
      alert("Network error establishing secure connection.");
      console.error(err);
    }
    btn.innerText = "Unlock";
    btn.disabled = false;
  }
});
