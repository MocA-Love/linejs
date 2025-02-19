import type { BaseStorage } from "@evex/linejs/storage";

import { type Kv, openKv } from "npm:@deno/kv";

/**
 * @classdesc Deno.Kv Storage for LINE Client
 * @constructor
 */
export class DenoKvStorage implements BaseStorage {
	useDeno = true;
	kv?: Deno.Kv | Kv;
	path?: string;
	kvPrefix = "LINEJS_Storage";
	constructor(path?: string) {
		if (typeof globalThis.Deno === "undefined") {
			this.useDeno = false;
		} else if (typeof Deno.openKv === "undefined") {
			console.warn(
				"info: Deno.openKv() is an unstable API.\nhint: Run again with `--unstable-kv` flag to enable this API.",
			);
			this.useDeno = false;
		}
		this.path = path;
	}
	public async set(
		key: string,
		value: any,
	): Promise<void> {
		if (!this.kv) {
			if (this.useDeno) {
				this.kv = await Deno.openKv(this.path);
			} else {
				this.kv = await openKv(this.path);
			}
		}
		await this.kv.set([this.kvPrefix, key], value);
	}
	public async get(
		key: string,
	): Promise<any | undefined> {
		if (!this.kv) {
			if (this.useDeno) {
				this.kv = await Deno.openKv(this.path);
			} else {
				this.kv = await openKv(this.path);
			}
		}
		return (await this.kv.get([this.kvPrefix, key])).value as any;
	}
	public async delete(key: string): Promise<void> {
		if (!this.kv) {
			if (this.useDeno) {
				this.kv = await Deno.openKv(this.path);
			} else {
				this.kv = await openKv(this.path);
			}
		}
		await this.kv.delete([this.kvPrefix, key]);
	}
	public async clear(): Promise<void> {
		if (!this.kv) {
			if (this.useDeno) {
				this.kv = await Deno.openKv(this.path);
			} else {
				this.kv = await openKv(this.path);
			}
		}
		const entries = this.kv.list({ prefix: [this.kvPrefix] });
		for await (const entry of entries) {
			await this.kv.delete(entry.key as any);
		}
	}
	public async migrate(storage: BaseStorage): Promise<void> {
		if (!this.kv) {
			if (this.useDeno) {
				this.kv = await Deno.openKv(this.path);
			} else {
				this.kv = await openKv(this.path);
			}
		}
		const entries = this.kv.list({ prefix: [this.kvPrefix] });
		for await (const entry of entries) {
			const key = (entry.key.at(1) || "").toString();
			if (key) {
				await storage.set(
					key,
					(await this.kv.get(entry.key as any)).value as any,
				);
			}
		}
	}
}
