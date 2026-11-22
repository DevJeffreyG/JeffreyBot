const { default: rateLimit } = require("express-rate-limit");
const { PermissionsBitField } = require("discord.js");
const { Guilds } = require("mongoose").models;
const { GenerateHmac, GetSession } = require("./Functions");

function verifySession(req, res, next) {
  const sessionCookie = req.cookies.jb_session;
  const csrfHeader = req.headers['x-csrf-token'];

  if (!sessionCookie || !csrfHeader) {
    return res.status(403).json({ error: 'Acceso denegado: Petición sin sesión anónima válida.' });
  }

  // Verificar que el token del Header corresponda a la cookie almacenada
  const expectedCsrfToken = GenerateHmac(sessionCookie);

  if (csrfHeader !== expectedCsrfToken) {
    return res.status(403).json({ error: 'Acceso denegado: Token inválido.' });
  }

  next();
}

/**
 * Autoriza el acceso a un guild de la dashboard.
 *
 * - Si el guild tiene roles STAFF configurados en Mongo, el usuario debe tener
 *   al menos uno de esos roles (esto manda sobre los permisos de Discord).
 * - Si no hay roles STAFF configurados, se usa el permiso ManageGuild de Discord,
 *   igual que en `Session.fetchAvailableGuilds()`.
 *
 * Deja disponibles `req.guildDoc`, `req.discordGuild` y `req.jbSession`.
 */
async function verifyGuildAccess(req, res, next) {
  try {
    const guildId = req.params.guildId ?? req.header("guildId");
    if (!guildId) {
      return res.status(400).json({ error: "Missing guildId" });
    }

    const session = GetSession(req.app?.SessionManager, req);
    if (!session?.discordUser?.id) {
      return res.status(403).json({ error: "Acceso denegado: sesión de Discord inválida." });
    }

    const guildDoc = await Guilds.getById(guildId);
    if (!guildDoc) {
      return res.status(404).json({ error: "Guild not found" });
    }

    const staffRoles = guildDoc.getStaffs?.() ?? [];
    let discordGuild = session.getGuild(guildId);

    if (staffRoles.length > 0) {
      // Con STAFF configurado, el rol es la fuente de autoridad.
      if (!discordGuild?.members) {
        try {
          await session.fetchGuild(guildId);
        } catch (err) {
          console.error("Error fetching guild for staff check:", err.message);
          return res.status(403).json({ error: "Acceso denegado: el bot no tiene acceso al servidor." });
        }
        discordGuild = session.getGuild(guildId);
      }

      const member = discordGuild?.members?.find(
        m => (m.user?.id ?? m.user_id) === session.discordUser.id
      );
      const memberRoles = member?.roles ?? [];

      if (!staffRoles.some(roleId => memberRoles.includes(roleId))) {
        return res.status(403).json({
          error: "Acceso denegado: no tienes un rol STAFF configurado en este servidor."
        });
      }
    } else {
      // Sin STAFF configurado, se mantiene el comportamiento original.
      let permissions = session.getGuildPermissions?.(guildId);

      if (!permissions) {
        try {
          await session.fetchAvailableGuilds();
        } catch (err) {
          console.error("Error fetching available guilds:", err.message);
          return res.status(403).json({ error: "Acceso denegado: no se pudieron verificar tus permisos." });
        }
        permissions = session.getGuildPermissions?.(guildId);
      }

      const canManage = new PermissionsBitField(permissions ?? 0)
        .has(PermissionsBitField.Flags.ManageGuild);

      if (!canManage) {
        return res.status(403).json({
          error: "Acceso denegado: necesitas el permiso de gestionar servidor."
        });
      }
    }

    req.guildDoc = guildDoc;
    req.discordGuild = discordGuild;
    req.jbSession = session;

    return next();
  } catch (err) {
    return next(err);
  }
}

const InitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30
})

module.exports = {
  verifySession,
  verifyGuildAccess,
  InitLimiter
}
