import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, "..");
const certDir = path.join(frontendDir, "certificates");
const keyPath = path.join(certDir, "dev-key.pem");
const certPath = path.join(certDir, "dev-cert.pem");

function getLocalIPv4Addresses() {
  const ips = new Set(["127.0.0.1"]);
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.address.startsWith("169.254.")) {
        ips.add(entry.address);
      }
    }
  }
  return Array.from(ips);
}

function certCoversHosts(certFile, keyFile, ips) {
  if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) return false;
  try {
    const x509 = new crypto.X509Certificate(fs.readFileSync(certFile));
    const privKey = crypto.createPrivateKey(fs.readFileSync(keyFile));
    if (!x509.checkPrivateKey(privKey)) return false;
    if (!x509.checkHost("localhost")) return false;
    for (const ip of ips) {
      if (!x509.checkIP(ip)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function generateCertWithPython(ips) {
  const candidates = [
    path.resolve(frontendDir, "..", "backend", "venv", "Scripts", "python.exe"),
    path.resolve(frontendDir, "..", "backend", "venv", "bin", "python"),
    "python",
    "python3",
  ];

  const pyScript = `
import datetime, ipaddress, pathlib, sys
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import ExtendedKeyUsageOID, NameOID

key_file = pathlib.Path(sys.argv[1])
cert_file = pathlib.Path(sys.argv[2])
ips = sys.argv[3:]

key_file.parent.mkdir(parents=True, exist_ok=True)
key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

subject = issuer = x509.Name([
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Jimamet Local Dev"),
    x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
])

san_items = [x509.DNSName("localhost")]
for raw_ip in ips:
    san_items.append(x509.IPAddress(ipaddress.ip_address(raw_ip)))

now = datetime.datetime.now(datetime.timezone.utc)
cert = (
    x509.CertificateBuilder()
    .subject_name(subject)
    .issuer_name(issuer)
    .public_key(key.public_key())
    .serial_number(x509.random_serial_number())
    .not_valid_before(now - datetime.timedelta(days=1))
    .not_valid_after(now + datetime.timedelta(days=365))
    .add_extension(x509.SubjectAlternativeName(san_items), critical=False)
    .add_extension(
        x509.ExtendedKeyUsage([ExtendedKeyUsageOID.SERVER_AUTH]),
        critical=False,
    )
    .sign(key, hashes.SHA256())
)

key_file.write_bytes(
    key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    )
)
cert_file.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
`;

  for (const pyBin of candidates) {
    if (pyBin.includes(path.sep) && !fs.existsSync(pyBin)) continue;
    try {
      execFileSync(pyBin, ["-c", pyScript, keyPath, certPath, ...ips], {
        stdio: "pipe",
      });
      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        return true;
      }
    } catch {
      // Try next Python binary
    }
  }
  return false;
}

const ips = getLocalIPv4Addresses();
let hasCustomCert = certCoversHosts(certPath, keyPath, ips);

if (!hasCustomCert) {
  hasCustomCert = generateCertWithPython(ips);
}

if (process.argv.includes("--cert-only")) {
  console.log(
    JSON.stringify({
      ok: hasCustomCert && certCoversHosts(certPath, keyPath, ips),
      ips,
      certPath,
      keyPath,
    })
  );
  process.exit(hasCustomCert ? 0 : 1);
}

const lanIps = ips.filter((ip) => ip !== "127.0.0.1");
console.log("\n======================================================");
console.log("  Jimamet HTTPS Dev Mode (Kamera Real-Time Mobile/LAN)");
console.log("======================================================");
console.log("  Local:   https://localhost:3000");
for (const ip of lanIps) {
  console.log(`  Network: https://${ip}:3000`);
}
console.log(
  "  Catatan: Saat pertama kali dibuka di HP, pilih 'Advanced / Lanjutan' -> 'Proceed / Lanjutkan'."
);
console.log("======================================================\n");

const nextBin = path.join(
  frontendDir,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

const args = [nextBin, "dev", "-H", "0.0.0.0", "--experimental-https"];
if (hasCustomCert) {
  args.push(
    "--experimental-https-key",
    keyPath,
    "--experimental-https-cert",
    certPath
  );
}

const child = spawn(process.execPath, args, {
  cwd: frontendDir,
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
