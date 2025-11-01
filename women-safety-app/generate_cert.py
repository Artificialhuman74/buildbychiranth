"""
Generate self-signed SSL certificate for local HTTPS development
Run this once to create cert.pem and key.pem
"""
from OpenSSL import crypto
import socket

# Generate private key
key = crypto.PKey()
key.generate_key(crypto.TYPE_RSA, 2048)

# Generate certificate
cert = crypto.X509()
cert.get_subject().C = "IN"
cert.get_subject().ST = "Karnataka"
cert.get_subject().L = "Bangalore"
cert.get_subject().O = "Women Safety App"
cert.get_subject().OU = "Development"
cert.get_subject().CN = "localhost"

# Add Subject Alternative Names for mobile access
cert.add_extensions([
    crypto.X509Extension(b"subjectAltName", False, 
                        b"DNS:localhost,DNS:*.local,IP:127.0.0.1,IP:0.0.0.0")
])

cert.set_serial_number(1000)
cert.gmtime_adj_notBefore(0)
cert.gmtime_adj_notAfter(365*24*60*60)  # Valid for 1 year
cert.set_issuer(cert.get_subject())
cert.set_pubkey(key)
cert.sign(key, 'sha256')

# Write private key
with open('key.pem', 'wb') as f:
    f.write(crypto.dump_privatekey(crypto.FILETYPE_PEM, key))

# Write certificate
with open('cert.pem', 'wb') as f:
    f.write(crypto.dump_certificate(crypto.FILETYPE_PEM, cert))

print("✅ Generated SSL certificate successfully!")
print("   - cert.pem (certificate)")
print("   - key.pem (private key)")
print()
print("📱 To use on your mobile:")
print(f"   1. Find your local IP: ipconfig (look for IPv4 Address)")
print(f"   2. Access: https://YOUR_LOCAL_IP:5000")
print(f"   3. Accept the security warning on mobile browser")
print()
print("🔒 This is a self-signed certificate for development only!")
