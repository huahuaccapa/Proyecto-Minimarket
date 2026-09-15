import "dotenv/config";

function numberEnv(
  value,
  fallback,
) {
  const parsed =
    Number(
      value,
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : fallback;
}

function booleanEnv(
  value,
  fallback =
    false,
) {
  if (
    value ===
    undefined ||
    value ===
    null ||
    value ===
    ""
  ) {
    return fallback;
  }

  return [
    "true",
    "1",
    "yes",
    "si",
    "sí",
  ].includes(
    String(
      value,
    )
      .trim()
      .toLowerCase(),
  );
}

function required(
  name,
  fallback =
    undefined,
) {
  const value =
    process.env[
      name
    ] ??
    fallback;

  if (
    value ===
      undefined ||
    value ===
      null ||
    String(
      value,
    ).trim() ===
      ""
  ) {
    throw new Error(
      `Falta la variable de entorno ${name}`,
    );
  }

  return value;
}

const frontendUrls =
  String(
    process.env.FRONTEND_URL ||
      "http://localhost:3000",
  )
    .split(",")
    .map(
      (
        item,
      ) =>
        item.trim(),
    )
    .filter(
      Boolean,
    );

export const env = {
  port:
    numberEnv(
      process.env.PORT,
      4000,
    ),

  nodeEnv:
    process.env.NODE_ENV ||
    "development",

  frontendUrl:
    frontendUrls[0] ||
    "http://localhost:3000",

  frontendUrls,

  db: {
    host:
      required(
        "DB_HOST",
        "127.0.0.1",
      ),

    port:
      numberEnv(
        process.env.DB_PORT,
        3306,
      ),

    name:
      required(
        "DB_NAME",
        "minimarket_mama",
      ),

    user:
      required(
        "DB_USER",
        "root",
      ),

    password:
      process.env.DB_PASSWORD ||
      "",

    connectionLimit:
      Math.max(
        1,

        numberEnv(
          process.env
            .DB_CONNECTION_LIMIT,
          10,
        ),
      ),

    ssl:
      booleanEnv(
        process.env.DB_SSL,
        false,
      ),

    sslRejectUnauthorized:
      booleanEnv(
        process.env
          .DB_SSL_REJECT_UNAUTHORIZED,
        true,
      ),
  },
};