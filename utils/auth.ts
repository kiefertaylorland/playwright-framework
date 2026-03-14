export interface Credentials {
  username: string;
  password: string;
}

function requireEnvVar(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value;
}

export function getSauceCredentials(): Credentials {
  return {
    username: requireEnvVar('SAUCE_USERNAME'),
    password: requireEnvVar('SAUCE_PASSWORD'),
  };
}

export const LOCKED_OUT_USER = 'locked_out_user';

export const INVALID_CREDENTIALS: Credentials = {
  username: 'invalid_user',
  password: 'wrong_password',
};
