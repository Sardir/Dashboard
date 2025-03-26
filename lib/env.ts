export const getEnvVar = (name: string, defaultValue = ""): string => {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name] || defaultValue
  }
  return defaultValue
}

export const getDbPassword = (): string => {
  // Use environment variable but don't expose it in client-side code
  return getEnvVar("DB_PASSWORD", "")
}

