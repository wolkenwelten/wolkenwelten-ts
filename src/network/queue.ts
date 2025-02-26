/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
import type { WSPacket, WSCall, WSReply } from "./messages";

type PromiseHandler = {
	resolve: (value: unknown) => void;
	reject: (reason?: unknown) => void;
};

export class WSQueue {
	id = 0;
	callQueue: WSCall[] = [];
	replyQueue: WSReply[] = [];
	callHandlers: Map<string, (...args: unknown[]) => Promise<unknown>> =
		new Map();

	promises: Map<number, PromiseHandler> = new Map();

	call(T: string, ...args: unknown[]): Promise<unknown> {
		const id = ++this.id;
		const call: WSCall = {
			T,
			id,
			args,
		};
		this.callQueue.push(call);
		return new Promise<unknown>((resolve, reject) => {
			this.promises.set(id, { resolve, reject });
		});
	}

	handleReply(reply: WSReply) {
		const handler = this.promises.get(reply.id);
		if (!handler) {
			return;
		}
		if (reply.error) {
			handler.reject(reply.error);
		} else {
			handler.resolve(reply.value);
		}
		this.promises.delete(reply.id);
	}

	handleCall(call: WSCall) {
		const handler = this.callHandlers.get(call.T);
		if (!handler) {
			throw new Error(`No handler for call ${call.T}`);
		}
		handler(...call.args).then((value) => {
			try {
				const reply: WSReply = {
					T: call.T,
					id: call.id,
					value,
					error: "",
				};
				this.replyQueue.push(reply);
			} catch (error) {
				console.error(error);
				this.replyQueue.push({
					T: call.T,
					id: call.id,
					value: null,
					error: "Error",
				});
			}
		});
	}

	handlePacket(packet: WSPacket) {
		for (const call of packet.calls) {
			this.handleCall(call);
		}
		for (const reply of packet.replies) {
			this.handleReply(reply);
		}
	}

	registerCallHandler(
		T: string,
		handler: (...args: unknown[]) => Promise<unknown>,
	) {
		this.callHandlers.set(T, handler);
	}

	unregisterCallHandler(T: string) {
		this.callHandlers.delete(T);
	}

	flush(): string {
		const packet: WSPacket = {
			T: "packet",
			calls: this.callQueue,
			replies: this.replyQueue,
		};
		const ret = JSON.stringify(packet);
		this.callQueue.length = 0;
		this.replyQueue.length = 0;
		return ret;
	}
}
