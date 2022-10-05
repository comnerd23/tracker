import { ZeroMQClient, ZeroMQServer } from "./pubsub.js";
import Tracker from "./binance.js";

let server = new ZeroMQServer("127.0.0.1", 3000, "tcp");

server.Methods({
    getMax: async (symbol, interval, limit) => await Tracker.getMax(symbol, interval, limit),
    getTop10: asset => Tracker.getTop10Symbols(asset),
    getPrice: async symbol => await Tracker.getPrice(symbol),
    pow: (number, pow) => Math.pow(number, pow)
});

server.Publish({
    kline: async (symbol, interval) => Tracker.subscribeToKline(symbol, interval),
    price: (symbol, callback) => Tracker.subscribeToPrice(symbol, callback),
    futurePrice: (symbol, callback) => Tracker.subscribeToFuturePrice(symbol, callback)
});

server.start();
//

let client = new ZeroMQClient("127.0.0.1", 3000, "tcp");

client.connect();

(async () => {
    await client.sub("price", "BTCBUSD", price => console.log("price : ", price));
})();