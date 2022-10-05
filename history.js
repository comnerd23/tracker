import Candle from './candle.js';

export default class History {
    #symbol;
    #candles = [];

    constructor(symbol) {
        this.#symbol = symbol;
    }

    update(object) {
        const lastCandle = this.#getLastCandle(object);

        if (lastCandle) lastCandle.update(object);
        else this.#candles.push(new Candle(object));
    }

    get #last() { return this.#candles[this.#candles.length - 1] }

    #getLastCandle(object) {
        let lastCandle = this.#last;

        if (lastCandle) {
            const date = new Date(object.eventTime);
            const minute = date.getMinutes();
            const lastCandleMinute = lastCandle.date.getMinutes();

            if (!(minute > lastCandleMinute)) return lastCandle;
        }
    }

    // Public Methods
    get symbol() { return this.#symbol }
    get average() { return this.#last.average }
    get totalNumOfTrades() { return this.#last.totalNumOfTrades }
    get totalVolume() { return this.#last.totalVolume }
    get totalQuoteVolume() { return this.#last.totalQuoteVolume }
    get totalQuantity() { return this.#last.totalQuantity }
    get totalPriceCount() { return this.#last.totalPriceCount }
    get closePrice() { return this.#last.close }

    get hasObject() { return this.#last !== undefined }

    writeObject = () => this.#last.writeObject();
}