/* Copyright - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * ViteTemplate – lightweight HTML templating helper that bridges Express and
 * Vite.
 *
 * Development mode:
 *   • Uses Vite's `transformIndexHtml()` to inject HMR scripts and re-renders
 *     the template once per second if the file's `mtime` has changed.
 * Production mode:
 *   • Reads the pre-built file from `./dist/{name}.html` on startup via
 *     `loadAll()`.  Forgetting to call this will throw on the first render.
 *
 * Placeholder syntax: write `<!--HEAD-->`, `<!--CONTENT-->`, or custom keys in
 * upper-case comments inside your HTML. `render()` performs a naïve string
 * replacement for each key/value pair – avoid collisions where dynamic content
 * might contain the marker text.
 *
 * Footguns & Caveats:
 *   • `dev()` relies on second-resolution `mtime`; extremely rapid edits may
 *     not trigger reload until the next tick.
 *   • No HTML sanitisation is performed; caller must ensure `content` is safe
 *     (use `escapeHtml` for user-supplied strings).
 */
import express from "express";
import cookieParser from "cookie-parser";
import fsp from "fs/promises";
import config from "./config";
import type { ViteDevServer } from "vite";

/**
 * Data structure for template rendering
 * Contains placeholders that will be replaced in HTML templates
 */
export type ViteTemplateData = {
	head: string; // HTML head content (title, meta tags, etc.)
	content: string; // Main page content
};

/**
 * Metadata type definition for page rendering
 * Contains essential SEO and display information
 */
export type MetaData = {
	title: string;
	description?: string;
	ogImage?: string;
	canonicalUrl?: string;
	jsonLd?: any;
	noIndex?: boolean;
};

/**
 * Helper function to escape HTML special characters
 * Prevents XSS attacks when inserting dynamic content
 *
 * @param text Text to escape
 * @returns Escaped HTML-safe text
 */
const escapeHtml = (text: string) => {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
};

/**
 * Template rendering system
 * Handles loading, caching, and rendering HTML templates
 * Supports both development mode with hot reloading and production mode
 */
export class ViteTemplate {
	/** Registry of all template instances for bulk operations */
	static readonly templates: Map<string, ViteTemplate> = new Map();

	/** Cached rendered template content */
	public rendered = "";
	/** Timestamp of last template reload (for dev mode) */
	private lastTemplateLoad: Date | null = null;

	/**
	 * Creates a new template instance
	 * @param name Template name (corresponds to HTML file without extension)
	 */
	constructor(public name: string) {
		ViteTemplate.templates.set(name, this);
	}

	/**
	 * Renders the template with the provided data
	 * Replaces placeholders in the template with actual content
	 *
	 * @param data Template data with values to insert
	 * @returns Rendered HTML string
	 */
	render(data: ViteTemplateData) {
		if (this.rendered === "") {
			throw new Error(`Template ${this.name} not loaded yet`);
		}

		let rendered = this.rendered;
		for (const [key, value] of Object.entries(data)) {
			rendered = rendered.replace(`<!--${key.toUpperCase()}-->`, value);
		}
		return rendered;
	}

	screenshot(url: string, width = 1280, height = 720) {
		return `https://url2og.cocz.net/?url=${encodeURIComponent(url)}&width=${width}&height=${height}`;
	}

	/**
	 * Renders a complete page with metadata and content
	 * Handles title, description, canonical URL, and JSON-LD
	 *
	 * @param meta Page metadata (title, description, etc.)
	 * @param content Main page content (HTML)
	 * @returns Fully rendered HTML page
	 */
	renderPage(meta: MetaData, content: string) {
		let head = `<title>${escapeHtml(meta.title)}</title>`;
		if (meta.description) {
			head += `<meta name="description" content="${meta.description}">`;
		}
		let openGraph = "";
		openGraph += `<meta property="og:title" content="${meta.title}">`;
		openGraph += `<meta property="og:type" content="website">`;
		openGraph += `<meta property="og:locale" content="en_US">`;
		const ogImage =
			meta.ogImage ??
			this.screenshot(meta.canonicalUrl ?? config.createAbsoluteUrl("/"));
		openGraph += `<meta property="og:image" content="${ogImage}">`;

		if (meta.description) {
			openGraph += `<meta property="og:description" content="${meta.description}">`;
		}
		if (meta.canonicalUrl) {
			head += `<link rel="canonical" href="${meta.canonicalUrl}">`;
			openGraph += `<meta property="og:url" content="${meta.canonicalUrl}">`;
		}
		head += openGraph;

		// Twitter Card meta tags
		let twitterCard = "";
		twitterCard += `<meta name="twitter:card" content="summary_large_image">`;
		twitterCard += `<meta name="twitter:title" content="${meta.title}">`;
		if (meta.description) {
			twitterCard += `<meta name="twitter:description" content="${meta.description}">`;
		}
		twitterCard += `<meta name="twitter:image" content="${ogImage}">`;

		head += twitterCard;

		if (meta.jsonLd) {
			head += `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`;
		}
		if (meta.noIndex) {
			head += `<meta name="robots" content="noindex">`;
		}

		return this.render({ head, content });
	}

	/**
	 * Loads the template from disk (production mode)
	 * Reads the pre-built HTML file from the dist directory
	 */
	async load() {
		if (config.nodeEnv === "production") {
			this.rendered = await fsp.readFile(`./dist/${this.name}.html`, "utf-8");
		}
	}

	/**
	 * Sets up hot reloading for development mode
	 * Watches the template file and reloads when changes are detected
	 *
	 * @param vite Vite development server instance
	 */
	async dev(vite: ViteDevServer) {
		const filename = this.name + ".html";
		const reloadTemplate = async () => {
			const now = (await fsp.stat(filename)).mtime;
			if (!this.lastTemplateLoad || now > this.lastTemplateLoad) {
				console.log(`Reloading template ${this.name}!`);
				this.rendered = await vite.transformIndexHtml(
					"/",
					await fsp.readFile(filename, "utf-8"),
				);
				this.lastTemplateLoad = now;
			}
		};

		await reloadTemplate();
		setInterval(reloadTemplate, 1000);
	}

	/**
	 * Loads all registered templates
	 * Used in production mode at startup
	 */
	static async loadAll() {
		await Promise.all(
			Array.from(ViteTemplate.templates.values()).map((t) => t.load()),
		);
	}

	/**
	 * Sets up development mode for all templates
	 * Enables hot reloading for all registered templates
	 *
	 * @param vite Vite development server instance
	 */
	static async devAll(vite: ViteDevServer) {
		await Promise.all(
			Array.from(ViteTemplate.templates.values()).map((t) => t.dev(vite)),
		);
	}
}

/**
 * Starts the Vite development server
 * Sets up middleware mode for integration with Express
 * Enables hot module replacement and template reloading
 *
 * @param app Express application instance
 */
export const startDevServer = async (app: express.Express) => {
	console.error("Starting Dev Server!!!");
	const { createServer } = await import("vite");
	const vite = await createServer({
		server: {
			middlewareMode: true,
		},
		appType: "custom",
	});
	app.use(vite.middlewares);
	app.use(cookieParser());

	await ViteTemplate.devAll(vite);
};
