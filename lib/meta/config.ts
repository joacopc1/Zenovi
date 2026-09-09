import "server-only";

export type InstagramOAuthConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
};

const requiredInstagramOAuthVariables = [
  "INSTAGRAM_APP_ID",
  "INSTAGRAM_APP_SECRET",
  "INSTAGRAM_OAUTH_REDIRECT_URI",
  "META_TOKEN_ENCRYPTION_KEY",
] as const;

export function isInstagramOAuthConfigured() {
  return requiredInstagramOAuthVariables.every((name) => Boolean(process.env[name]?.trim()));
}

export function getInstagramOAuthConfig(): InstagramOAuthConfig {
  const appId = getRequiredServerVariable("INSTAGRAM_APP_ID");
  const appSecret = getRequiredServerVariable("INSTAGRAM_APP_SECRET");
  const redirectUri = getRequiredServerVariable("INSTAGRAM_OAUTH_REDIRECT_URI");

  if (!/^\d+$/.test(appId)) {
    throw new Error("INSTAGRAM_APP_ID no tiene un formato válido.");
  }

  const parsedRedirectUri = new URL(redirectUri);
  const isLocalDevelopment =
    parsedRedirectUri.protocol === "http:" && parsedRedirectUri.hostname === "localhost";

  if (parsedRedirectUri.protocol !== "https:" && !isLocalDevelopment) {
    throw new Error("INSTAGRAM_OAUTH_REDIRECT_URI debe usar HTTPS.");
  }

  return {
    appId,
    appSecret,
    redirectUri: parsedRedirectUri.toString(),
  };
}

export function getMetaTokenEncryptionKey() {
  const encodedKey = getRequiredServerVariable("META_TOKEN_ENCRYPTION_KEY");
  const key = Buffer.from(encodedKey, "base64");

  if (key.length !== 32 || key.toString("base64").replace(/=+$/, "") !== encodedKey.replace(/=+$/, "")) {
    throw new Error("META_TOKEN_ENCRYPTION_KEY debe contener exactamente 32 bytes en base64.");
  }

  return key;
}

function getRequiredServerVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Falta la variable de servidor ${name}.`);
  }

  return value;
}
