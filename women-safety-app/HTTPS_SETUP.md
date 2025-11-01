# HTTPS Setup for Mobile Access

This guide explains how to run the Women's Safety App with HTTPS to enable full sensor access on mobile devices (GPS, accelerometer, camera, etc.).

## Quick Start

### 1. Generate SSL Certificate (One-time setup)
```powershell
cd women-safety-app
python generate_cert.py
```

This creates:
- `cert.pem` - SSL certificate
- `key.pem` - Private key

### 2. Start HTTPS Server

**Option A: Using PowerShell script (Recommended)**
```powershell
.\start_https.ps1
```

**Option B: Direct Python command**
```powershell
python run_https.py
```

The script will display:
- Local URL: `https://localhost:5000`
- Mobile URL: `https://YOUR_IP:5000`

## Mobile Setup

### Step 1: Connect to Same WiFi
- Ensure your mobile phone and computer are on the same WiFi network

### Step 2: Find Your Local IP Address
```powershell
ipconfig
```
Look for **IPv4 Address** under your active network adapter (usually starts with `192.168.x.x` or `10.x.x.x`)

### Step 3: Access on Mobile
1. Open your mobile browser (Chrome, Safari, etc.)
2. Navigate to: `https://YOUR_LOCAL_IP:5000`
   - Example: `https://192.168.1.100:5000`

### Step 4: Accept Security Warning

Since we're using a self-signed certificate, you'll see a security warning:

**Android (Chrome):**
1. Click "Advanced"
2. Click "Proceed to [IP address] (unsafe)"

**iOS (Safari):**
1. Tap "Show Details"
2. Tap "visit this website"
3. Tap "Visit Website" again

**Why this is safe for local development:**
- The certificate is generated on YOUR computer
- Traffic stays within your local network
- This is standard practice for mobile app development

## Features Enabled with HTTPS

✅ **GPS/Location Services**
- Precise location tracking for safe routes
- Real-time location sharing during SOS

✅ **Motion Sensors**
- Shake detection for emergency alerts
- Fall detection algorithms

✅ **Camera Access**
- Evidence photo capture
- Profile photo upload

✅ **Microphone**
- Emergency voice recordings
- Fake call feature audio

✅ **Background Services**
- Persistent location tracking
- Background SOS monitoring

## Troubleshooting

### Can't connect from mobile?
1. Check firewall settings:
   ```powershell
   # Allow Python through Windows Firewall
   netsh advfirewall firewall add rule name="Flask HTTPS" dir=in action=allow protocol=TCP localport=5000
   ```

2. Verify you're using HTTPS (not HTTP):
   - ✅ `https://192.168.1.100:5000`
   - ❌ `http://192.168.1.100:5000`

3. Disable VPN temporarily (can interfere with local network)

### Certificate expired?
Certificates are valid for 1 year. Regenerate:
```powershell
python generate_cert.py
```

### Still seeing HTTP?
Make sure `cert.pem` and `key.pem` exist in the `women-safety-app` folder:
```powershell
dir cert.pem
dir key.pem
```

## Production Deployment

⚠️ **Self-signed certificates are for development only!**

For production, use:
- **Let's Encrypt** (free SSL certificates)
- **Cloudflare** (free SSL proxy)
- **AWS Certificate Manager** (if hosting on AWS)

## Security Notes

### Local Network Only
- Your app is accessible to any device on your WiFi
- Don't use on public WiFi without additional security
- For testing only - not production ready

### Certificate Warnings
- Browsers warn because the certificate isn't verified by a Certificate Authority
- Safe to accept on your personal devices during development
- Users will see this warning until you deploy with a real certificate

## Alternative: ngrok for Remote Access

If you need to access from outside your local network:

```powershell
# Install ngrok
choco install ngrok

# Run ngrok
ngrok http https://localhost:5000

# Use the ngrok HTTPS URL on your mobile
```

## Files Created

```
women-safety-app/
├── cert.pem              # SSL certificate (don't commit)
├── key.pem               # Private key (don't commit)
├── generate_cert.py      # Certificate generator script
├── run_https.py          # HTTPS app runner
└── start_https.ps1       # PowerShell starter script
```

**Important:** Add to `.gitignore`:
```
cert.pem
key.pem
```

## Next Steps

1. ✅ Start HTTPS server
2. ✅ Access from mobile browser
3. ✅ Accept certificate warning
4. ✅ Test sensor features (location, shake detection, etc.)
5. ✅ Test SOS features with location tracking
6. ✅ Test camera/photo upload

## Support

If you encounter issues:
1. Check Windows Firewall settings
2. Verify WiFi connectivity
3. Try disabling antivirus temporarily
4. Use `ipconfig` to confirm your IP address
5. Check browser console for errors (F12 → Console)
