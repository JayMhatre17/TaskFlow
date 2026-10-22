const REQUIRED_TEST_DATABASE = "taskflow_test";

export const assertTestDatabaseConfiguration = (
  env: Record<string, string | undefined>,
) => {
  if (env.NODE_ENV !== "test") {
    throw new Error('Test database configuration requires NODE_ENV="test".');
  }

  const connectionString = env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required for tests and must target "taskflow_test".',
    );
  }

  let databaseUrl: URL;
  try {
    databaseUrl = new URL(connectionString);
  } catch {
    throw new Error(
      'DATABASE_URL is malformed; tests require a PostgreSQL URL targeting "taskflow_test".',
    );
  }

  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !databaseUrl.hostname
  ) {
    throw new Error(
      'DATABASE_URL must be a valid PostgreSQL URL targeting "taskflow_test".',
    );
  }

  let databaseName: string;
  try {
    databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));
  } catch {
    throw new Error(
      'DATABASE_URL is malformed; tests require a PostgreSQL URL targeting "taskflow_test".',
    );
  }

  if (databaseName !== REQUIRED_TEST_DATABASE) {
    throw new Error(
      'DATABASE_URL must target the "taskflow_test" database before tests can run.',
    );
  }
};
