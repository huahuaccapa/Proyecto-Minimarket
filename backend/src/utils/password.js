import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

/*
 * ==========================================
 * SHA-256 LEGACY
 * ==========================================
 *
 * Se mantiene únicamente para poder
 * iniciar sesión con contraseñas de la
 * versión antigua del sistema.
 *
 * Cuando el usuario inicia sesión
 * correctamente, automáticamente se
 * convierte a scrypt.
 */

function legacySha256(value) {
  return createHash("sha256")
    .update(String(value))
    .digest("hex");
}

/*
 * ==========================================
 * CREAR HASH SEGURO
 * ==========================================
 */

export function hashPassword(value) {
  const salt =
    randomBytes(16)
      .toString("hex");

  const digest =
    scryptSync(
      String(value),
      salt,
      64,
    ).toString("hex");

  return `scrypt$${salt}$${digest}`;
}

/*
 * ==========================================
 * DETECTAR HASH ANTIGUO
 * ==========================================
 */

export function isLegacyPasswordHash(
  hash = "",
) {
  return /^[a-f0-9]{64}$/i.test(
    String(hash),
  );
}

/*
 * ==========================================
 * VERIFICAR CONTRASEÑA
 * ==========================================
 */

export function verifyPassword(
  value,
  storedHash = "",
) {
  const hash =
    String(
      storedHash || "",
    );

  /*
   * Contraseñas antiguas SHA-256.
   */
  if (
    isLegacyPasswordHash(hash)
  ) {
    try {
      const expected =
        Buffer.from(
          hash,
          "hex",
        );

      const received =
        Buffer.from(
          legacySha256(value),
          "hex",
        );

      return (
        expected.length ===
          received.length &&
        timingSafeEqual(
          expected,
          received,
        )
      );
    } catch {
      return false;
    }
  }

  /*
   * Contraseñas nuevas scrypt.
   */
  const [
    algorithm,
    salt,
    digest,
  ] =
    hash.split("$");

  if (
    algorithm !== "scrypt" ||
    !salt ||
    !digest
  ) {
    return false;
  }

  try {
    const expected =
      Buffer.from(
        digest,
        "hex",
      );

    const received =
      scryptSync(
        String(value),
        salt,
        expected.length,
      );

    return (
      expected.length ===
        received.length &&
      timingSafeEqual(
        expected,
        received,
      )
    );
  } catch {
    return false;
  }
}