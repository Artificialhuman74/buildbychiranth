"""
Network Diagnostics for Mobile Access
"""
import socket
import requests

def get_local_ip():
    """Get local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "Unable to detect"

def check_server():
    """Check if Flask server is running"""
    try:
        response = requests.get('http://127.0.0.1:5000/api/health', timeout=2)
        return "✅ Server is running"
    except:
        return "❌ Server is NOT running"

def main():
    print("\n" + "="*60)
    print("📱 MOBILE ACCESS DIAGNOSTICS")
    print("="*60)
    
    local_ip = get_local_ip()
    server_status = check_server()
    
    print(f"\n🌐 Your PC's IP Address: {local_ip}")
    print(f"🖥️  Server Status: {server_status}")
    
    print("\n📱 On your phone, try this URL:")
    print(f"   https://{local_ip}:5000")
    
    print("\n✅ CHECKLIST:")
    print("   1. Is your phone connected to the same WiFi/Hotspot?")
    
    if "192.168.137" in local_ip:
        print("   ⚠️  Your PC appears to be using Mobile Hotspot mode")
        print("   2. Connect your phone to your PC's hotspot")
        print("      (Look for hotspot name in PC Settings)")
    else:
        print("   2. Both devices should be on the same WiFi network")
    
    print("\n   3. When you access the URL, you'll see a certificate warning")
    print("      - Android: Tap 'Advanced' → 'Proceed to...'")
    print("      - iOS: Tap 'Show Details' → 'visit this website'")
    
    print("\n   4. If 'This site can't be reached' appears:")
    print("      - Verify WiFi connection")
    print("      - Try turning off VPN on phone")
    print("      - Run PowerShell as Admin and execute:")
    print("        netsh advfirewall firewall add rule name=\"Flask HTTPS\" \\")
    print("        dir=in action=allow protocol=TCP localport=5000")
    
    print("\n" + "="*60)

if __name__ == '__main__':
    main()
