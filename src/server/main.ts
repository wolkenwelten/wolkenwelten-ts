/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import { WebSocketServer } from "ws";
import { ServerGame } from "./serverGame.js";
import { ViteTemplate } from "./viteTemplate.js";
import cookieParser from "cookie-parser";
import config from "./config.js";
import http from "http";
import { startDevServer } from "./viteTemplate.js";
import express from "express";

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
		res.send(
			mainTemplate.renderPage(
				{
					title: "WolkenWelten",
				},
				`<h1>WolkenWelten</h1>
		<a href="/game">Join Game</a>
		`,
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

	const game = new ServerGame();

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
