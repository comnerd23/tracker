import zmq from "zeromq";

Function.prototype.construct = function (argArray) {
    var constr = this;
    var inst = Object.create(constr.prototype);
    constr.apply(inst, argArray);
    return inst;
};

class ZeroMQSub {
    #method = void 0;
    #callback = void 0;

    constructor(method) {
        this.#method = method;
    }

    call() {
        let arr = arguments[0];
        arr.push(arguments[1]);
        this.#method.apply(null, arr);
        // 
        // const arf = ;
        // console.log(arf);
        // const args = [].join.call(arguments, ',');
        // console.log(args);
        // // if (parameters.at(-1) instanceof Function) {
        // // }

        // const args =Array.prototype.slice.call(parameters).join(",");
        // console.log(args, callback);

        // const args = f(parameters);
        // var foo = Object.create(this.#method.prototype);
        // this.#method.construct("foo", "abc");
        // this.#method(arguments[0].join(","), () => {
        //     console.log()
        // });

        // this.#method().call(null, arguments[0].join(','));
    }
}

class ZeroMQClient {
    #sub = new zmq.Subscriber;
    #request = new zmq.Request;

    #publishAddress = "";
    #RPCAddress = "";

    #callbacks = {};

    constructor(address, port, protocol) {
        this.#publishAddress = protocol + "://" + address + ":" + port;
        this.#RPCAddress = protocol + "://" + address + ":" + (port + 1);
    }

    connect = async () => {
        this.#sub.connect(this.#publishAddress);
        this.#request.connect(this.#RPCAddress);

        console.log("connected");

        for await (const [topic, msg] of this.#sub) this.#callbacks[topic](msg.toString("utf8"));
    }

    call = async (name, ...parameters) => {
        await this.#request.send(JSON.stringify({ type: 'method', name: name, parameters: parameters }));

        return (await this.#request.receive()).toString("utf8");
    }

    sub = async (topic, ...parameters) => {
        if (parameters.at(-1) instanceof Function) {
            const callback = parameters.pop();
            const name = topic + parameters.join('');
            this.#callbacks[name] = callback;
        }

        const object = JSON.stringify({
            type: 'sub',
            topic: topic,
            parameters: parameters
        });

        await this.#request.send(object);
        const canSubscribe = await this.#request.receive();

        if (canSubscribe) {
            const name = topic + parameters.join('');
            this.#sub.subscribe(name);

            return name;
        }
    }

    unsub = async name => {
        await this.#request.send(JSON.stringify({
            type: 'unsub',
            name: name
        }));

        this.#sub.unsubscribe(name);
        console.log("bitti");
    } 
}

class ZeroMQServer {
    #pub = new zmq.Publisher;
    #reply = new zmq.Reply;

    #publishAddress = "";
    #RPCAddress = "";

    #methodsHolder = {};
    #subsHolder = {};

    constructor(address, port, protocol) {
        this.#publishAddress = protocol + "://" + address + ":" + port;
        this.#RPCAddress = protocol + "://" + address + ":" + (port + 1);
    }

    start = async () => {
        Promise.all([
            await this.#pub.bind(this.#publishAddress),
            await this.#reply.bind(this.#RPCAddress)
        ]);

        console.log("Started");
        await this.#listenRPC();
    }

    #listenRPC = async () => {
        for await (const [msg] of this.#reply) {
            try {
                const obj = JSON.parse(msg.toString("utf8"));

                if (obj.type === "method")
                    await this.#reply.send((await this.#methodsHolder[obj.name].apply(this, obj.parameters)));

                else if (obj.type === "sub") {
                    const name = obj.topic + obj.parameters.join('');

                    obj.parameters.push(async response => await this.#pub.send([name, response]));

                    this.#subsHolder[obj.topic].apply(null, obj.parameters);
    
                    await this.#reply.send(true);
                }

            } catch (error) {
                console.error(error);
            }
        }
    }

    Methods = methods => Object.keys(methods).forEach(name => this.#methodsHolder[name] = methods[name]);
    Publish = subs => Object.keys(subs).forEach(name => this.#subsHolder[name] = subs[name]);
}

export { ZeroMQClient as ZeroMQClient, ZeroMQServer as ZeroMQServer };