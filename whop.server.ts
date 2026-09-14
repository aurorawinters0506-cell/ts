import { getRequestHeader } from "@tanstack/react-start/server";
import { WhopClient } from "@whop/sdk";

export type WhopIdentity = {
  id: string;
  name: string;
  plan: string;
};

const SMART_POINT_PRODUCT_ID = "prod_JklFk53fvcISG";

/**
 * Authentifie le membre à partir du token envoyé par Whop
 * sur les requêtes de l'application embarquée.
 *
 * IMPORTANT :
 * - Le token n'est jamais décodé manuellement.
 * - Les paramètres URL / localStorage ne servent pas à l'autorisation.
 * - L'accès est vérifié directement auprès de Whop.
 */
export async function resolveWhopIdentity(): Promise<WhopIdentity | null> {
  const token =
    getRequestHeader("x-whop-user-token") ??
    getRequestHeader("X-Whop-User-Token");

  if (!token) {
    return null;
  }

  try {
    const whop = new WhopClient({
      token,
    });

    // Vérifie le token et récupère l'utilisateur réellement authentifié.
    const userResponse = await whop.users.me();
    const user = userResponse.data;

    if (!user?.id) {
      return null;
    }

    const accessResponse = await whop.users.checkAccess({
      id: user.id,
      resource_id: SMART_POINT_PRODUCT_ID,
    });

    const access = accessResponse.data;

    if (!access?.has_access) {
      return null;
    }

    const name =
      user.username ??
      user.name ??
      user.id;

    return {
      id: user.id,
      name,
      plan: "Premium Member",
    };
  } catch (error) {
    console.error("[Whop] Authentication/access check failed:", error);
    return null;
  }
}