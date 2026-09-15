import {
  pool,
} from "../config/database.js";

/*
 * ==========================================
 * SIGUIENTE NÚMERO
 * ==========================================
 *
 * Ejemplos:
 *
 * sale        -> V-0001
 * purchase    -> C-0001
 * cashSession -> CAJ-0001
 *
 * Se utiliza una transacción para evitar
 * números repetidos si dos operaciones
 * ocurren casi al mismo tiempo.
 */

export async function nextNumber(
  name,
  prefix,
  connection = null,
) {
  const db =
    connection ||
    pool;

  /*
   * UPDATE atómico.
   */
  await db.execute(
    `
    INSERT INTO sequences
    (
      name,
      current_value
    )
    VALUES (?, 1)

    ON DUPLICATE KEY UPDATE
      current_value =
        current_value + 1
    `,

    [
      name,
    ],
  );

  const [
    rows,
  ] =
    await db.execute(
      `
      SELECT
        current_value
      FROM sequences
      WHERE name = ?
      LIMIT 1
      `,

      [
        name,
      ],
    );

  const value =
    Number(
      rows[0]
        ?.current_value ||
        0,
    );

  return `${prefix}-${String(
    value,
  ).padStart(
    4,
    "0",
  )}`;
}