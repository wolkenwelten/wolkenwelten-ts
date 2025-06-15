/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 *
 * main.ts – entry point for the standalone WolkenWelten game server.
 *
 * Responsibilities:
 *   • Configure and start an Express HTTP application that serves the
 *     landing page (`/`) and the client game page (`/game`).
 *   • In development it spins up a Vite dev-server in middleware mode to
 *     enable hot-module reloading and template transforms; in production it
 *     loads pre-built HTML from the `dist/` directory.
 *   • Boots the authoritative `ServerGame` instance and attaches a
 *     `WebSocketServer` on `/api/ws`, forwarding each incoming socket to
 *     `game.onConnect` for processing.
 *   • Displays a simple player list on the landing page, showcasing live
 *     interaction between HTTP and the game state.
 *
 * Operational caveats:
 *   • Ensure `npm run build` has been executed before running in production,
 *     otherwise `ViteTemplate.loadAll()` will throw.
 *   • Two `unhandledRejection` listeners are registered – if you refactor this
 *     keep them consolidated to avoid duplicate logging.
 */
import { WebSocketServer } from "ws";
import { ServerGame } from "./serverGame.js";
import { ViteTemplate } from "./viteTemplate.js";
import cookieParser from "cookie-parser";
import config from "./config.js";
import http from "http";
import { startDevServer } from "./viteTemplate.js";
import express from "express";
import indexContent from "./indexContent.html?raw";

const mainTemplate = new ViteTemplate("index");
const gameTemplate = new ViteTemplate("game");

const main = async () => {
	const app = express();

	// Basic Express configuration
	app.disable("x-powered-by");
	app.disable("etag");
	app.use(express.json({ limit: "50mb" }));
	app.use(express.urlencoded({ extended: true, limit: "50mb" }));
	app.use(cookieParser());

	// Environment-specific setup
	if (config.nodeEnv === "development") {
		// Development mode: serve from public and use Vite dev server
		app.use(express.static("public"));
		await startDevServer(app);
	} else {
		// Production mode: load pre-built templates and serve from dist
		try {
			await ViteTemplate.loadAll();
		} catch (error) {
			console.error("Error loading templates:", error);
			console.error(
				"Please run `npm run build` to build the templates before starting the server in production mode.",
			);
			process.exit(1);
		}
		app.use(express.static("dist", { index: false }));
	}

	app.get("/", (req, res) => {
		const playerList = Array.from(game.sockets.values())
			.map((socket) => {
				return `<li>${socket.playerName}</li>`;
			})
			.join("");
		const players = playerList
			? `<div class="player-list"><h4>Players</h4><ul>${playerList}</ul></div>`
			: "<div class='player-list'><h4>Nobody is playing right now (｡•́︿•̀｡)</h4><h5>Maybe you'll bring a friend and play together?</h5></div>";
		const content = indexContent.replace("<!--PLAYERS-->", players);
		res.send(
			mainTemplate.renderPage(
				{
					title: "WolkenWelten",
				},
				content,
			),
		);
	});

	app.get("/game", (req, res) => {
		res.send(
			gameTemplate.renderPage(
				{
					title: "WolkenWelten - Game",
				},
				"",
			),
		);
	});

	// Global error handler for unhandled promise rejections
	process.on("unhandledRejection", (reason, promise) => {
		console.error("Unhandled Rejection at:", promise, "reason:", reason);
	});

	// Create HTTP server instance to allow WebSocket upgrades
	const server = http.createServer(app);

	const wss = new WebSocketServer({
		server: server,
		path: "/api/ws",
	});

	// Global error handler for unhandled promise rejections
	process.on("unhandledRejection", (reason, promise) => {
		console.error("Unhandled Rejection at:", promise, "reason:", reason);
	});

	const game = new ServerGame({ debug: config.nodeEnv === "development" });

	const onConnect = game.onConnect.bind(game);
	wss.on("connection", onConnect);
	wss.on("error", (error) => {
		console.error(`(╥﹏╥) WebSocketServer error:`, error);
	});

	wss.on("close", () => {
		console.log(`(｡•́︿•̀｡) WebSocketServer closed`);
	});

	await game.init();

	// Start listening for requests
	server.listen(config.port, () => {
		console.log(`Server is running on port ${config.port}`);
	});
};
main();
