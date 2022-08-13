import { onValue, onChildAdded, onChildChanged, onChildRemoved, onChildMoved } from "firebase/database";
import https from 'https';
import readline from 'readline';
function createTask() {
    const task = {
        done: false
    };
    task.promise = new Promise((resolve, reject)=>{
        task.cancel = (err)=>{
            if (!task.done) {
                task.done = true;
                reject(err);
            }
        };
        task.finish = (result)=>{
            if (!task.done) {
                task.done = true;
                resolve(result);
            }
        };
    });
    return task;
}
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms)
    );
}
function listenForAll(dbRef) {
    onValue(dbRef, (snapshot)=>{
        const data = snapshot.val();
        console.log("Vdata: ", data);
    });
    onChildAdded(dbRef, (snapshot)=>{
        const data = snapshot.val();
        console.log("CAdata:", data);
    });
    onChildChanged(dbRef, (snapshot)=>{
        const data = snapshot.val();
        console.log("CCdata:", data);
    });
    onChildMoved(dbRef, (snapshot)=>{
        const data = snapshot.val();
        console.log("CMdata:", data);
    });
    onChildRemoved(dbRef, (snapshot)=>{
        const data = snapshot.val();
        console.log("CRdata:", data);
    });
}
function withTimeout(promise, timeout) {
    return new Promise((resolve, reject)=>{
        promise.then((...data)=>resolve(...data)
        );
        setTimeout(()=>{
            reject();
        }, timeout);
    });
}
function normalize(str) {
    return str.normalize('NFD').replace(/(<:ph0t0shop:910908399275876362>|[\u0300-\u036f ])/g, "").toLowerCase().trim();
}
function readFileFromURL(url, mapper) {
    return new Promise((resolve)=>{
        https.get(url, async (res)=>{
            res.setEncoding('utf8');
            const result = [];
            const rl = readline.createInterface({
                input: res,
                crlfDelay: Infinity
            });
            for await (const line of rl){
                result.push(mapper(line));
            }
            resolve(result);
        });
    });
}
function extractAmount(str) {
    let i = 0;
    let char;
    for(; i < str.length; i++){
        char = str[i];
        if (char < '0' || char > '9') {
            break;
        }
    }
    if (i == 0 || str[i] != 'x') {
        return [
            str,
            1
        ];
    }
    return [
        str.substring(i + 1).trim(),
        parseInt(str)
    ] // TODO: change this to parseInt(str)
    ;
}
function formatNum(num) {
    return num.toLocaleString('en-US', {
        maximumFractionDigits: 0
    });
}
var tmp = Symbol.iterator;
class ObjectSet {
    get size() {
        return Object.keys(this.dict).length;
    }
    add(value) {
        this.dict[value.id] = value;
        return this;
    }
    clear() {
        this.dict = {
        };
    }
    delete(value1) {
        return delete this.dict[value1.id];
    }
    map(mapFunc) {
        const res = [];
        for (const value of this){
            res.push(mapFunc(value));
        }
        return res;
    }
    getById(id) {
        return this.dict[id];
    }
    has(value2) {
        return value2.id in this.dict;
    }
    *[tmp]() {
        for(const item in this.dict){
            yield this.dict[item];
        }
    }
    constructor(items){
        this.dict = {
        };
        if (items) {
            for (const item of items){
                this.add(item);
            }
        }
    }
}
function UTF8ToBase64(str) {
    return Buffer.from(encodeURIComponent(str), 'utf-8').toString('base64');
}
function base64ToUTF8(str) {
    return decodeURIComponent(Buffer.from(str, 'base64').toString("utf-8"));
}
export { getRandomInt, sleep, listenForAll, createTask, withTimeout, readFileFromURL, formatNum, normalize, extractAmount, ObjectSet, UTF8ToBase64, base64ToUTF8 };
