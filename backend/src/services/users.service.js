import { pool } from "../config/database.js";

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,

    username: row.username,

    name: row.name,

    passwordHash: row.passwordHash,

    role: row.role,

    active: Boolean(row.active),

    mustChangePassword: Boolean(row.mustChangePassword),

    passwordUpdatedAt: row.passwordUpdatedAt || null,

    createdAt: row.createdAt || null,

    updatedAt: row.updatedAt || null,
  };
}

const USER_SELECT = `
  SELECT
    id,

    username,

    name,

    password_hash
      AS passwordHash,

    role,

    active,

    must_change_password
      AS mustChangePassword,

    password_updated_at
      AS passwordUpdatedAt,

    created_at
      AS createdAt,

    updated_at
      AS updatedAt

  FROM users
`;

export async function findUserByUsername(username) {
  const normalized = String(username || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return null;
  }

  const [rows] = await pool.execute(
    `
      ${USER_SELECT}

      WHERE LOWER(username) = ?

      LIMIT 1
      `,

    [normalized],
  );

  return mapUser(rows[0]);
}

export async function findActiveUserByUsername(username) {
  const user = await findUserByUsername(username);

  return user && user.active ? user : null;
}

export async function findUserById(id) {
  if (!id) {
    return null;
  }

  const [rows] = await pool.execute(
    `
      ${USER_SELECT}

      WHERE id = ?

      LIMIT 1
      `,

    [id],
  );

  return mapUser(rows[0]);
}

export async function findActiveUserById(id) {
  const user = await findUserById(id);

  return user && user.active ? user : null;
}

export async function listUsers() {
  const [rows] = await pool.execute(
    `
      ${USER_SELECT}

      ORDER BY
        CASE
          WHEN role = 'Administrador'
          THEN 0

          ELSE 1
        END,

        name ASC,

        username ASC
      `,
  );

  return rows.map(mapUser).map(safeUser);
}

export async function createUser({
  id,

  username,

  name,

  passwordHash,

  role,

  active = true,

  mustChangePassword = true,
}) {
  const now = new Date();

  await pool.execute(
    `
    INSERT INTO users
    (
      id,

      username,

      name,

      password_hash,

      role,

      active,

      must_change_password,

      password_updated_at,

      created_at,

      updated_at
    )

    VALUES
    (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
    `,

    [
      id,

      String(username).trim().toLowerCase(),

      String(name).trim(),

      passwordHash,

      role,

      active ? 1 : 0,

      mustChangePassword ? 1 : 0,

      now,

      now,

      now,
    ],
  );

  return findUserById(id);
}

export async function updateUser(userId, changes) {
  const fields = [];

  const values = [];

  if (changes.username !== undefined) {
    fields.push("username = ?");

    values.push(String(changes.username).trim().toLowerCase());
  }

  if (changes.name !== undefined) {
    fields.push("name = ?");

    values.push(String(changes.name).trim());
  }

  if (changes.role !== undefined) {
    fields.push("role = ?");

    values.push(changes.role);
  }

  if (changes.active !== undefined) {
    fields.push("active = ?");

    values.push(changes.active ? 1 : 0);
  }

  if (!fields.length) {
    return findUserById(userId);
  }

  fields.push("updated_at = ?");

  values.push(new Date());

  values.push(userId);

  await pool.execute(
    `
    UPDATE users

    SET
      ${fields.join(", ")}

    WHERE id = ?
    `,

    values,
  );

  return findUserById(userId);
}

export async function updatePasswordHash(
  userId,

  passwordHash,

  { mustChangePassword = false } = {},
) {
  const now = new Date();

  const [result] = await pool.execute(
    `
      UPDATE users

      SET
        password_hash = ?,

        must_change_password = ?,

        password_updated_at = ?,

        updated_at = ?

      WHERE id = ?
      `,

    [passwordHash, mustChangePassword ? 1 : 0, now, now, userId],
  );

  return result.affectedRows > 0;
}

export function safeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,

    username: user.username,

    name: user.name,

    role: user.role,

    active: Boolean(user.active),

    mustChangePassword: Boolean(user.mustChangePassword),

    passwordUpdatedAt: user.passwordUpdatedAt || null,

    createdAt: user.createdAt || null,

    updatedAt: user.updatedAt || null,
  };
}
