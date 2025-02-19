/// <reference lib="dom"/>

import type { BaseStorage } from "@evex/linejs/storage";

function successToPromise<T extends IDBRequest>(
	request: T,
): Promise<T["result"]> {
	return new Promise<T["result"]>((resolve, reject) => {
		request.onsuccess = () => {
			resolve(request.result);
		};
		request.onerror = (event) => {
			reject(event);
		};
	});
}
function completeToPromise<T extends IDBTransaction>(
	transaction: T,
): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		transaction.oncomplete = () => {
			resolve();
		};
		transaction.onerror = (event) => {
			reject(event);
		};
	});
}

export class IndexedDBStorage implements BaseStorage {
	onclose?: () => void;
	onblocked?: () => void;
	dbName: string;
	storeName: string;
	#db?: IDBDatabase;
	constructor(
		dbName: string = "IndexedDBStorage",
		storeName: string = "linejs",
	) {
		this.dbName = dbName;
		this.storeName = storeName;
	}
	addhandler(db: IDBDatabase) {
		db.onversionchange = () => {
			db.close();
			this.onclose && this.onclose();
		};
	}
	async open(): Promise<IDBDatabase> {
		if (!this.#db) {
			const request = indexedDB.open(this.dbName);
			request.onblocked = () => {
				this.onblocked && this.onblocked();
			};
			request.onupgradeneeded = () => {
				const db = request.result;

				db.createObjectStore(this.storeName, { keyPath: "key" });
			};
			this.#db = await successToPromise(request);
			this.addhandler(this.#db);
		}
		return this.#db;
	}
	public async set(
		key: string,
		value: any,
	): Promise<void> {
		const db = await this.open();
		const transaction = db.transaction(this.storeName, "readwrite");
		const success = successToPromise(
			transaction.objectStore(this.storeName).put({ key, value }),
		);
		const complete = completeToPromise(transaction);
		await success;
		await complete;
	}
	public async get(
		key: string,
	): Promise<any | undefined> {
		const db = await this.open();
		const transaction = db.transaction(this.storeName);
		const complete = completeToPromise(transaction);
		const value = await successToPromise(
			transaction.objectStore(this.storeName).get(key),
		);
		await complete;
		return value && value.value;
	}
	public async delete(key: string): Promise<void> {
		const db = await this.open();
		const transaction = db.transaction(this.storeName, "readwrite");
		const success = successToPromise(
			transaction.objectStore(this.storeName).delete(key),
		);
		const complete = completeToPromise(transaction);
		await success;
		await complete;
	}
	public async clear(): Promise<void> {
		const db = await this.open();
		const version = db.version;
		db.close();
		const request = indexedDB.open(this.dbName, version + 1);
		request.onblocked = () => {
			this.onblocked && this.onblocked();
		};
		request.onupgradeneeded = () => {
			const db = request.result;
			db.deleteObjectStore(this.storeName);
			db.createObjectStore(this.storeName, { keyPath: "key" });
		};
		this.#db = await successToPromise(request);
		this.addhandler(this.#db);
	}
	public async migrate(storage: BaseStorage): Promise<void> {
		const db = await this.open();
		const transaction = db.transaction(this.storeName, "readwrite");
		const complete = completeToPromise(transaction);
		const objectStore = transaction.objectStore(this.storeName);
		const request = objectStore.openCursor();
		const { promise, resolve } = Promise.withResolvers<void>();
		const promises: Promise<void>[] = [];
		request.onsuccess = () => {
			const cursor = request.result;
			if (cursor) {
				const { value, key } = cursor.value;
				promises.push(storage.set(key, value));
				cursor.continue();
			} else {
				resolve();
			}
		};
		await Promise.all(promises);
		await promise;
		await complete;
	}
}
