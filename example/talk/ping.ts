import {
	loginWithAuthToken,
	loginWithPassword,
	loginWithQR,
} from "@evex/linejs";
import { FileStorage } from "@evex/linejs/storage";

const client = await loginWithPassword({
	email: "",
	password: "",
	onPincodeRequest(pin) {
		console.log(pin);
	},
}, {
	device: "DESKTOPWIN",
	storage: new FileStorage("./storage.json"),
});

client.on("message", async (message) => {
	console.log(message.text);
	if (message.text === "!ping") {
		await message.react("NICE");
		await message.reply("pong!");
	}
});

client.listen({ talk: true });
