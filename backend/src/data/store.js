import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const __filename =
  fileURLToPath(
    import.meta.url,
  );

const __dirname =
  path.dirname(
    __filename,
  );

const DATA_DIR =
  path.resolve(
    __dirname,
    "../../data",
  );

const DATA_FILE =
  path.join(
    DATA_DIR,

    process.env
      .NODE_ENV ===
      "test"
      ? "db.test.json"
      : "db.json",
  );

const now =
  new Date()
    .toISOString();

/*
 * ==========================================
 * CONTRASEÑAS
 * ==========================================
 */

const legacySha256 = (
  value,
) =>
  createHash(
    "sha256",
  )
    .update(
      String(
        value,
      ),
    )
    .digest(
      "hex",
    );

export function hashPassword(
  value,
) {
  const salt =
    randomBytes(
      16,
    ).toString(
      "hex",
    );

  const digest =
    scryptSync(
      String(
        value,
      ),

      salt,

      64,
    ).toString(
      "hex",
    );

  return `scrypt$${salt}$${digest}`;
}

export function isLegacyPasswordHash(
  hash = "",
) {
  return /^[a-f0-9]{64}$/i.test(
    String(
      hash,
    ),
  );
}

export function verifyPassword(
  value,
  storedHash = "",
) {
  const hash =
    String(
      storedHash ||
        "",
    );

  /*
   * Compatibilidad con
   * contraseñas antiguas.
   */
  if (
    isLegacyPasswordHash(
      hash,
    )
  ) {
    const expected =
      Buffer.from(
        hash,
        "hex",
      );

    const received =
      Buffer.from(
        legacySha256(
          value,
        ),
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
  }

  const [
    algorithm,
    salt,
    digest,
  ] =
    hash.split(
      "$",
    );

  if (
    algorithm !==
      "scrypt" ||
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
        String(
          value,
        ),

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

/*
 * ==========================================
 * BASE INICIAL
 * ==========================================
 */

const initialStore =
  () => ({
    meta: {
      sequences: {
        sale:
          0,

        purchase:
          0,

        cashSession:
          0,

        customerAccount:
          0,
      },

      version:
        5,
    },

    /*
     * IMPORTANTE:
     *
     * Las sesiones ahora
     * también se guardan
     * en db.json.
     *
     * Ya NO desaparecen
     * cuando Node reinicia.
     */
    sessions: [],

    users: [
      {
        id:
          "u1",

        username:
          "admin",

        name:
          "Administrador",

        passwordHash:
          hashPassword(
            "123",
          ),

        role:
          "Administrador",

        active:
          true,
      },

      {
        id:
          "u2",

        username:
          "aydee",

        name:
          "Aydee",

        passwordHash:
          hashPassword(
            "123",
          ),

        role:
          "Vendedora",

        active:
          true,
      },
    ],

    categories: [
      {
        id:
          "cat1",

        name:
          "Abarrotes",

        description:
          "Alimentos secos y productos de despensa",

        active:
          true,

        createdAt:
          now,
      },

      {
        id:
          "cat2",

        name:
          "Bebidas",

        description:
          "Gaseosas, agua, jugos y bebidas",

        active:
          true,

        createdAt:
          now,
      },

      {
        id:
          "cat3",

        name:
          "Lácteos",

        description:
          "Leche, yogurt, queso y derivados",

        active:
          true,

        createdAt:
          now,
      },

      {
        id:
          "cat4",

        name:
          "Limpieza",

        description:
          "Productos para limpieza del hogar",

        active:
          true,

        createdAt:
          now,
      },

      {
        id:
          "cat5",

        name:
          "Mascotas",

        description:
          "Alimentos y cuidado para mascotas",

        active:
          true,

        createdAt:
          now,
      },
    ],

    brands: [
      {
        id:
          "brand1",

        name:
          "Gloria",

        description:
          "Productos lácteos y alimentos",

        active:
          true,

        createdAt:
          now,
      },

      {
        id:
          "brand2",

        name:
          "Inca Kola",

        description:
          "Bebidas gaseosas",

        active:
          true,

        createdAt:
          now,
      },

      {
        id:
          "brand3",

        name:
          "Costeño",

        description:
          "Abarrotes",

        active:
          true,

        createdAt:
          now,
      },

      {
        id:
          "brand4",

        name:
          "Primor",

        description:
          "Aceites y alimentos",

        active:
          true,

        createdAt:
          now,
      },

      {
        id:
          "brand5",

        name:
          "Bolívar",

        description:
          "Limpieza del hogar",

        active:
          true,

        createdAt:
          now,
      },
    ],

    products: [
      {
        id:
          "p1",

        barcode:
          "7750243051205",

        name:
          "Leche Gloria Entera",

        description:
          "Leche evaporada entera",

        categoryId:
          "cat3",

        brandId:
          "brand1",

        purchasePresentation:
          "unidad",

        purchasePrice:
          3.6,

        contentQuantity:
          1,

        purchaseQuantity:
          28,

        unitCost:
          3.6,

        salePrice:
          4.5,

        stock:
          28,

        minStock:
          8,

        saleUnit:
          "unidad",

        image:
          "",

        expirationDate:
          "",

        sanitaryRegistration:
          "",

        lot:
          "",

        active:
          true,

        createdAt:
          now,
      },

      {
        id:
          "p2",

        barcode:
          "7750885001019",

        name:
          "Inca Kola 600 ml",

        description:
          "Botella personal de 600 ml",

        categoryId:
          "cat2",

        brandId:
          "brand2",

        purchasePresentation:
          "paquete",

        purchasePrice:
          26.4,

        contentQuantity:
          12,

        purchaseQuantity:
          3,

        unitCost:
          2.2,

        salePrice:
          3,

        stock:
          36,

        minStock:
          10,

        saleUnit:
          "unidad",

        image:
          "",

        expirationDate:
          "",

        sanitaryRegistration:
          "",

        lot:
          "",

        active:
          true,

        createdAt:
          now,
      },
    ],

    suppliers: [
      {
        id:
          "sup1",

        businessName:
          "Distribuidora Arequipa",

        ruc:
          "20400000001",

        phone:
          "054-400000",

        email:
          "ventas@distribuidoraarequipa.pe",

        address:
          "Arequipa, Perú",

        notes:
          "Proveedor principal.",

        active:
          true,

        representatives:
          [],

        createdAt:
          now,
      },
    ],

    customers: [],

    customerCredits: [],

    customerPayments: [],

    sales: [],

    purchases: [],

    expenses: [],

    inventoryMovements: [],

    cashMovements: [],

    cashSessions: [],
  });

/*
 * ==========================================
 * MIGRACIONES
 * ==========================================
 */

function migrate(
  data,
) {
  const base =
    initialStore();

  const merged = {
    ...base,
    ...data,
  };

  /*
   * Garantizamos que todas
   * las colecciones existan.
   */
  for (
    const key of [
      "sessions",
      "users",
      "categories",
      "brands",
      "products",
      "suppliers",
      "customers",
      "customerCredits",
      "customerPayments",
      "sales",
      "purchases",
      "expenses",
      "inventoryMovements",
      "cashMovements",
      "cashSessions",
    ]
  ) {
    if (
      !Array.isArray(
        merged[
          key
        ],
      )
    ) {
      merged[
        key
      ] = [];
    }
  }

  merged.meta = {
    ...base.meta,
    ...(data.meta ||
      {}),

    version:
      5,
  };

  merged.meta.sequences = {
    ...base.meta
      .sequences,

    ...(data.meta
      ?.sequences ||
      {}),
  };

  /*
   * Compatibilidad con
   * usuarios de versiones
   * anteriores.
   */
  merged.users =
    merged.users.map(
      (
        user,
      ) => {
        const {
          password,
          ...rest
        } =
          user;

        return {
          ...rest,

          passwordHash:
            user.passwordHash ||
            hashPassword(
              password ||
                "123",
            ),
        };
      },
    );

  /*
   * Eliminamos sesiones
   * evidentemente corruptas.
   *
   * Las expiradas también
   * serán limpiadas por
   * auth.js.
   */
  merged.sessions =
    merged.sessions.filter(
      (
        session,
      ) =>
        session &&
        session.token &&
        session.userId &&
        Number.isFinite(
          Number(
            session.expiresAt,
          ),
        ),
    );

  return merged;
}

/*
 * ==========================================
 * CARGA
 * ==========================================
 */

function loadStore() {
  fs.mkdirSync(
    DATA_DIR,
    {
      recursive:
        true,
    },
  );

  if (
    !fs.existsSync(
      DATA_FILE,
    )
  ) {
    const fresh =
      initialStore();

    fs.writeFileSync(
      DATA_FILE,

      JSON.stringify(
        fresh,
        null,
        2,
      ),
    );

    return fresh;
  }

  try {
    return migrate(
      JSON.parse(
        fs.readFileSync(
          DATA_FILE,
          "utf8",
        ),
      ),
    );
  } catch (
    error
  ) {
    console.error(
      "No se pudo leer la base de datos:",
      error,
    );

    const backup =
      `${DATA_FILE}.corrupt-${Date.now()}`;

    try {
      fs.copyFileSync(
        DATA_FILE,
        backup,
      );
    } catch {
      //
    }

    const fresh =
      initialStore();

    fs.writeFileSync(
      DATA_FILE,

      JSON.stringify(
        fresh,
        null,
        2,
      ),
    );

    return fresh;
  }
}

export const store =
  loadStore();

/*
 * ==========================================
 * PERSISTENCIA SEGURA
 * ==========================================
 */

export function persistStore() {
  fs.mkdirSync(
    DATA_DIR,
    {
      recursive:
        true,
    },
  );

  const temp =
    `${DATA_FILE}.tmp`;

  fs.writeFileSync(
    temp,

    JSON.stringify(
      store,
      null,
      2,
    ),
  );

  fs.renameSync(
    temp,
    DATA_FILE,
  );
}

/*
 * ==========================================
 * NUMERACIONES
 * ==========================================
 */

export function nextNumber(
  type,
  prefix,
) {
  store.meta
    .sequences[
      type
    ] =
    Number(
      store.meta
        .sequences[
          type
        ] ||
        0,
    ) + 1;

  return `${prefix}-${String(
    store.meta
      .sequences[
        type
      ],
  ).padStart(
    4,
    "0",
  )}`;
}