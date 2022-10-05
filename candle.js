export default class Candle {
    #date;                                                                                                              //

    #open = .0;                                                                                                         //
    #close = .0;                                                                                                        //
    #low = .0;                                                                                                          //
    #high = .0;                                                                                                         //

    #average = .0;                                                                                                      //

    #lastNumOfTrades = 0;
    #totalNumOfTrades = 0;

    #totalVolume = .0;
    #totalQuoteVolume = .0;
    #totalQuantity = .0;

    #totalPriceCount = 0;
    #lastTradeId = 0;

    constructor(object) {
        this.#date = new Date(object.eventTime);

        this.#open = object.tradePrice;
        this.#low = object.tradePrice;
        this.#high = object.tradePrice;
        this.#close = object.tradePrice;

        this.#lastNumOfTrades = object.numOfTrades;
        this.#totalVolume = object.volume;
        this.#totalQuoteVolume = object.quoteVolume;
        this.#lastTradeId = object.lastTradeId;
    }

    update(object) {
        this.#high = Math.max(this.#high, object.tradePrice);
        this.#low = Math.min(this.#low, object.tradePrice);
        this.#close = object.tradePrice;

        if (object.numOfTrades !== this.#lastNumOfTrades) {
            this.#totalNumOfTrades += (object.lastTradeId - this.#lastTradeId);

            this.#lastTradeId = object.lastTradeId;

            this.#lastNumOfTrades = object.numOfTrades;
            this.#average = Math.abs(100 - ((this.#high / this.#low) * 100));
            this.#totalVolume += (object.volume - this.#totalVolume);
            this.#totalQuoteVolume += (object.quoteVolume - this.#totalQuoteVolume);

            this.#totalQuantity += object.tradeQty;

            this.#totalPriceCount++;
        }
    }

    get date() { return this.#date }
    get open() { return this.#open }
    get close() { return this.#close }
    get low() { return this.#low }
    get high() { return this.#high }

    get average() { return this.#average }
    get totalNumOfTrades() { return this.#totalNumOfTrades }
    get totalVolume() { return this.#totalVolume }
    get totalQuoteVolume() { return this.#totalQuoteVolume }
    get totalQuantity() { return this.#totalQuantity }
    get totalPriceCount() { return this.#totalPriceCount }

    writeObject() {
        console.log({
            date: this.date,
            open: this.open,
            close: this.close,
            low: this.low,
            high: this.high,
            average: this.average,
            totalNumOfTrades: this.totalNumOfTrades,
            totalVolume: this.totalVolume,
            totalQuoteVolume: this.totalQuoteVolume,
            totalQuantity: this.totalQuantity,
            totalPriceCount: this.totalPriceCount
        });
    }
}