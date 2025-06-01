import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();
/**
 * Gets an environment variable with error handling
 * Throws an error if the variable is not set and no default is provided
 *
 * @param key Name of the environment variable
 * @param defaultValue Optional default value if not set
 * @returns Value of the environment variable
 */
function requireEnv(key: string, defaultValue?: string): string {
	const value = process.env[key];
	if (!value && defaultValue === undefined) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value || defaultValue || "";
}

/**
 * Validates NODE_ENV against allowed values
 * Ensures the application runs in a known environment
 *
 * @param env Environment value to validate
 * @returns Validated environment string
 */
function validateNodeEnv(
	env: string | undefined,
): "development" | "production" | "test" {
	if (env !== "development" && env !== "production" && env !== "test") {
		throw new Error(`Invalid NODE_ENV value: ${env}`);
	}
	return env;
}

/**
 * Generates the application configuration
 * Loads values from environment variables with sensible defaults
 *
 * @returns Complete application configuration object
 */
export const genConfig = () => {
	const config = {
		port: parseInt(requireEnv("PORT", "3030")),
		siteUrl: requireEnv("SITE_URL", "http://localhost:3030"),
		nodeEnv: validateNodeEnv(process.env.NODE_ENV || "production"),

		/**
		 * Creates an absolute URL from a relative path
		 * Ensures consistent URL formatting throughout the application
		 *
		 * @param path Relative path to convert
		 * @returns Full absolute URL
		 */
		createAbsoluteUrl: (path: string) => {
			const cleanPath = path.startsWith("/") ? path.slice(1) : path;
			return `${config.siteUrl}/${cleanPath}`.replace(/\/+$/, "");
		},
	};

	// Allow overriding nodeEnv through command line args
	for (const arg of process.argv) {
		if (arg.startsWith("--nodeEnv=")) {
			const nodeEnv = arg.split("=")[1];
			if (nodeEnv === "development") {
				config.nodeEnv = "development";
			} else if (nodeEnv === "production") {
				config.nodeEnv = "production";
			}
		}
	}

	return config;
};

// Create and export the config singleton
const config = genConfig();
export default config;
