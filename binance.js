import FStream from './stream.js';
import { Spot } from "@binance/connector";

import History from "./history.js";
import _ from 'underscore';

let Tracker;

export default Tracker = new (class Tracker {
    #binance;
    #histories = {};

    // #minimumObjects = {};

    #klineSUBS = {};
    #priceSUBS = {};
    #futurePriceSUBS = {};

    #ticker = {};
    #stream;

    constructor() {
        this.#binance = new Spot();
        this.#stream = new FStream();
        this.#stream.ticker(result => {
            console.log(result);
        });
        
        // this.#minimumObjects = await this.#minimums;

        // this.#startListenTicker();
        // const client = new WebSocketClient();
    }

    #heartbeat() {
        clearTimeout(this.pingTimeout);

        // Use `WebSocket#terminate()`, which immediately destroys the connection,
        // instead of `WebSocket#close()`, which waits for the close timer.
        // Delay should be equal to the interval at which your server
        // sends out pings plus a conservative assumption of the latency.
        this.pingTimeout = setTimeout(() => {
            this.terminate();
        }, 30000 + 1000);
    }


    getMax = async (symbol, interval, limit) => {
        try {
            const result = await this.#binance.klines(symbol, interval, { limit: limit });

            return Math.max.apply(null, result.data.map(kline => {
                const open = parseFloat(kline[1]);
                const high = parseFloat(kline[2]);
                const low = parseFloat(kline[3]);
                const close = parseFloat(kline[4]);

                let result = 0;
                if (close > open) result = ((high / low) - 1) * 100;
                else if (open > close) result = Math.abs(((low / high) - 1) * 100);

                return result;
            }));
        } catch (error) {
            console.error(error)
        }
    }

    getTop10SpotSymbols = asset => {
        let arr = _.map(this.#histories, item => {
            const baseAsset = item.symbol.substr(item.symbol.length - asset.length);
            if (asset === baseAsset) {
                return {
                    symbol: item.symbol,
                    average: item.average,
                    totalNumOfTrades: item.totalNumOfTrades,
                    totalVolume: item.totalVolume,
                    totalQuoteVolume: item.totalQuoteVolume,
                    totalQuantity: item.totalQuantity,
                    totalPriceCount: item.totalPriceCount
                }
            }
        });

        arr = _.without(arr, undefined);
        arr = _.sortBy(arr, 'totalNumOfTrades').reverse().slice(0, 10);
        arr = _.sortBy(arr, 'average').reverse();

        return arr;
    }

    getTop10FutureSymbols = asset => {
        //
    }

    getPrice = async symbol => {
        try { return parseFloat((await this.#binance.tickerPrice(symbol)).data.price) }
        catch (error) { throw error }
    }

    #parseData = data => {
        const symbol = data["s"];

        if ((symbol.includes("DOWN") || symbol.includes("UP"))) {
            // Futures
        } else {
            const result = this.#convertTrackerBinanceObj(data);

            if (this.#priceSUBS[symbol]) this.#priceSUBS[symbol](result.ask);

            this.#historyUpdate(symbol, result);
        }
    }

    #historyUpdate(symbol, result) {
        if (this.#histories[symbol] === undefined) {
            this.#histories[symbol] = new History(symbol);
        }

        this.#histories[symbol].update(result);
    }

    #startListenTicker = () => {
        this.#binance.tickerWS(null, {
            open: () => console.debug('open tracker'),
            close: () => console.debug('closed tracker'),
            message: object => JSON.parse(object).forEach(data => this.#parseData(data))
        });
    }

    #convertTrackerBinanceObj = data => {
        return {
            eventType: data["e"],                                                                                       // Event type
            eventTime: data["E"],                                                                                       // Event time
            symbol: data["s"],                                                                                          // Symbol
            priceChange: parseFloat(data["p"]),                                                                         // Price change
            percentChange: parseFloat(data["P"]),                                                                       // Price change percent
            averagePrice: parseFloat(data["w"]),                                                                        // Weighted average price
            firstTradePrice: parseFloat(data["x"]),                                                                     // First trade(F)-1 price (first trade before the 24hr rolling window)
            tradePrice: parseFloat(data["c"]),                                                                          // Last price
            tradeQty: parseFloat(data["Q"]),                                                                            // Last quantity
            bid: parseFloat(data["b"]),                                                                                 // Best bid price
            bidQty: parseFloat(data["B"]),                                                                              // Best bid quantity
            ask: parseFloat(data["a"]),                                                                                 // Best ask price
            askQty: parseFloat(data["A"]),                                                                              // Best ask quantity
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

    getPrice = symbol => this.#ticker[symbol];

    subscribeToPrice = (symbol, callback) => this.#priceSUBS[symbol] = callback;
    unsubscribeFromPrice = symbol => delete this.#priceSUBS[symbol];

    subscribeToFuturePrice = (symbol, callback) => this.#futurePriceSUBS[symbol] = callback;
    unsubscribeFromFuturePrice = symbol => delete this.#futurePriceSUBS[symbol];

    subscribeToKline = (symbol, interval, callback) => {
        const wsRef = this.#binance.klineWS(symbol, interval, {
            open: () => console.info('open ', symbol, interval),
            close: () => console.info('closed ', symbol, interval),
            message: data => callback(data)
        });

        this.#klineSUBS[symbol + interval] = wsRef;
    }

    unsubscribeFromKline = (symbol, interval) => {
        const wsRef = this.#klineSUBS[symbol + interval];
        if (wsRef) {
            this.#binance.unsubscribe(wsRef);
            delete this.#klineSUBS[symbol + interval];
        }
    }
})();