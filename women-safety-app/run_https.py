"""
Application runner with HTTPS support for mobile sensor access
Uses the Flask application factory defined in app/__init__.py
"""
import os
import ssl
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Check if SSL certificates exist
    cert_path = os.path.join(os.path.dirname(__file__), 'cert.pem')
    key_path = os.path.join(os.path.dirname(__file__), 'key.pem')
    
    if os.path.exists(cert_path) and os.path.exists(key_path):
        # HTTPS mode with SSL
        print("\n" + "="*60)
        print("🚀 Women's Safety App - HTTPS MODE")
        print("="*60)
        print("🔒 SSL Certificate: ACTIVE")
        print("📱 Mobile Access: ENABLED")
        print()
        print("Access the app:")
        print("   Local:  https://localhost:5000")
        print("   Mobile: https://YOUR_LOCAL_IP:5000")
        print()
        print("💡 Find your local IP:")
        print("   Windows: ipconfig (IPv4 Address)")
        print("   Mac/Linux: ifconfig or ip addr")
        print()
        print("⚠️  You'll need to accept the self-signed certificate")
        print("    warning on your mobile browser.")
        print("="*60 + "\n")
        
        # Create SSL context
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(cert_path, key_path)
        
        # Run with HTTPS on all interfaces (0.0.0.0) for mobile access
        app.run(
            debug=True,
            host='0.0.0.0',
            port=5000,
            ssl_context=context
        )
    else:
        # HTTP fallback
        print("\n" + "="*60)
        print("🚀 Women's Safety App - HTTP MODE")
        print("="*60)
        print("⚠️  SSL certificates not found!")
        print()
        print("To enable HTTPS:")
        print("   python generate_cert.py")
        print()
        print("Running in HTTP mode (localhost only)...")
        print("="*60 + "\n")
        
        app.run(debug=True, host='127.0.0.1', port=5000)
