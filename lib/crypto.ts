import nacl from "tweetnacl";

function base64ToBytes(base64: string): Uint8Array {
  if (typeof window !== "undefined") {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } else {
    return Uint8Array.from(Buffer.from(base64, "base64"));
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof window !== "undefined") {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } else {
    return Buffer.from(bytes).toString("base64");
  }
}

interface EncryptedBallotResult {
  encryptedBallot: string;
  ballotHash: string;
}

export async function encryptBallot(
  pollId: string,
  optionIdx: number,
  electionPublicKeyBase64: string
): Promise<EncryptedBallotResult> {
  // 1. Generate random json-level nonce
  const jsonNonceBytes = nacl.randomBytes(16);
  const jsonNonce = Array.from(jsonNonceBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 2. Build the JSON ballot payload
  const payload = {
    version: 1,
    poll_id: pollId,
    option_idx: optionIdx,
    nonce: jsonNonce,
  };

  const messageBytes = new TextEncoder().encode(JSON.stringify(payload));

  // 3. Decode recipient's election public key (X25519)
  const electionPublicKey = base64ToBytes(electionPublicKeyBase64);

  // 4. Generate ephemeral keypair (X25519)
  const ephemeralKeyPair = nacl.box.keyPair();

  // 5. Generate random 24-byte box nonce
  const boxNonce = nacl.randomBytes(24);

  // 6. Encrypt the ballot payload using NaCl Box
  const sealed = nacl.box(
    messageBytes,
    boxNonce,
    electionPublicKey,
    ephemeralKeyPair.secretKey
  );

  // 7. Format wire bytes: ephemeralPublicKey || boxNonce || sealed
  const wireBytes = new Uint8Array(
    ephemeralKeyPair.publicKey.length + boxNonce.length + sealed.length
  );
  wireBytes.set(ephemeralKeyPair.publicKey, 0);
  wireBytes.set(boxNonce, ephemeralKeyPair.publicKey.length);
  wireBytes.set(sealed, ephemeralKeyPair.publicKey.length + boxNonce.length);

  // 8. Convert to base64 wire representation
  const encryptedBallot = bytesToBase64(wireBytes);

  // 9. Generate SHA-256 hash (hex representation) of wire bytes
  let ballotHash = "";
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", wireBytes);
    ballotHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } else {
    // Node.js fallback for tests/SSR
    const cryptoNode = require("crypto");
    ballotHash = cryptoNode.createHash("sha256").update(wireBytes).digest("hex");
  }

  return {
    encryptedBallot,
    ballotHash,
  };
}
