import WebSocket from 'ws';

export default class FStream {
    constructor() {
        console.log("FStream constructor");
    }

    ticker(callback) {
        const client = new WebSocket('wss://fstream.binance.com/ws');

        client.on('message', data => {
            const message = data.toString();
            const parsedMessage = JSON.parse(message);

            if (parsedMessage.length > 0) {
                const msg = parsedMessage[0];
                const convertedBinanceObj = this.#convertTrackerBinanceObj(msg);

                callback(convertedBinanceObj);
            }
        })

        client.on('open', () => {
            console.info("opened");
        });

        client.on('error', err => {
            console.error(err);
        });

        client.on('close', () => {
            console.log("closed");
        });

        client.on('ping', () => {
            client.pong();
        });

        client.on('pong', () => {
            console.log("pong");
        })
    }

    // #pong(client) {
    // let m = {
    //     "method": "SUBSCRIBE",
    //     "params": ["BNBBUSD@ticker"],
    //     "id": 1
    // }
    //     const obj = {
    //         "method": "LIST_SUBSCRIPTIONS",
    //         "id": 3
    //     }
    //     client.pong();
    // }

    #convertTrackerBinanceObj = data => {
        return {
            eventType: data["e"],                                                                                       // Event type
            eventTime: data["E"],                                                                                       // Event time
            symbol: data["s"],                                                                                          // Symbol
            priceChange: parseFloat(data["p"]),                                                                         // Price change
            percentChange: parseFloat(data["P"]),                                                                       // Price change percent
            averagePrice: parseFloat(data["w"]),                                                                        // Weighted average price
            tradePrice: parseFloat(data["c"]),                                                                          // Last price
            tradeQty: parseFloat(data["Q"]),                                                                            // Last quantity
            openPrice: parseFloat(data["o"]),                                                                           // Open price
            highPrice: parseFloat(data["h"]),                                                                           // High price
            lowPrice: parseFloat(data["l"]),                                                                            // Low price
            volume: parseFloat(data["v"]),                                                                              // Total traded base asset volume
            quoteVolume: parseFloat(data["q"]),                                                                         // Total traded quote asset volume
            openTime: data["O"],                                                                                        // Statistics open time
            closeTime: data["C"],                                                                                       // Statistics close time
            firstTradeId: data["F"],                                                                                    // First trade ID
            lastTradeId: data["L"],                                                                                     // Last trade Id
            numOfTrades: data["n"]                                                                                      // Total number of trades
        }
    }
}

// export { Binance as Binance, GateIO as GateIO };