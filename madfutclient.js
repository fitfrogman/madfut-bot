import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from "firebase/app";
import { getRandomInt, sleep, createTask } from "./util.js";
import { getDatabase, ref, onValue, onChildAdded, onChildChanged, set, update, serverTimestamp, onDisconnect, off } from "firebase/database";
import { CustomProvider, initializeAppCheck } from "firebase/app-check";
const timeChars = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
var ProfileProperty1;
(function(ProfileProperty) {
    ProfileProperty["uid"] = 'a';
    ProfileProperty["username"] = 'b';
    ProfileProperty["nationId"] = 'c';
    ProfileProperty["wishList"] = 'd';
    ProfileProperty["messages"] = 'e';
    ProfileProperty["collectionPercentage"] = 'g';
})(ProfileProperty1 || (ProfileProperty1 = {
}));
const EmptyTradeRequirement = {
    receiveCoins: false,
    giveCoins: 0,
    givePacks: [],
    receivePacks: false,
    giveCards: [],
    receiveCards: false
};
var ActionType1;
(function(ActionType) {
    ActionType["loaded"] = 'b';
    ActionType["putCard"] = 'e';
    ActionType["putPack"] = 'o';
    ActionType["putCoins"] = 'q';
    ActionType["ready"] = 'h';
    ActionType["unready"] = 'i';
    ActionType["confirm"] = 'k';
    ActionType["handshake"] = 'l';
    ActionType["cancel"] = 'j';
    ActionType["wantCoinsMessage"] = 'r';
    ActionType["sendEmoji"] = 'n';
})(ActionType1 || (ActionType1 = {
}));
function isTradeHandshake(action) {
    return action.x === ActionType1.handshake;
}
class MadfutClient {
    async login(username, password) {
        const { user  } = await signInWithEmailAndPassword(this.auth, username, password);
        const splitDisplayName = user.displayName.split(",");
        this.username = splitDisplayName[0];
        this.nationId = splitDisplayName[1];
        this.uid = user.uid;
        this.invitesDatabase = getDatabase(this.app);
        this.tradingRoomDatabase = getDatabase(this.app, "https://bmf22-trading-rooms-1.europe-west1.firebasedatabase.app");
        this.loggedIn = true;
    }
    addInviteListener(callback, invitee) {
        const invitesRef = ref(this.invitesDatabase, invitee || this.username);
        onChildAdded(invitesRef, (snapshot)=>{
            callback(snapshot.key);
        });
        onChildChanged(invitesRef, (snapshot)=>{
            if (typeof snapshot.val() === 'number') {
                callback(snapshot.key);
            }
        });
    }
    async inviteUserCb(invitee1, callback1, inviter) {
        const invitePath = invitee1 + "/" + (inviter || this.username) + "," + this.nationId + "," + this.uid;
        const inviteRef = ref(this.invitesDatabase, invitePath);
        onDisconnect(inviteRef).remove();
        await set(inviteRef, Date.now() + 31536000000); // or serverTimestamp()
        onValue(inviteRef, (snapshot)=>{
            if (typeof snapshot.val() === 'number') return;
            if (snapshot.val() == null) {
                off(inviteRef);
                callback1(null);
                return;
            }
            // invite accepted
            const tradeRef = ref(this.tradingRoomDatabase, snapshot.val());
            callback1({
                tradeRef,
                amHosting: false
            });
        });
    }
    inviteWithTimeout(invitee2, timeout, inviter1) {
        return new Promise(async (resolve, reject)=>{
            const invitePath = invitee2 + "/" + (inviter1 || this.username) + "," + this.nationId + "," + this.uid;
            const inviteRef = ref(this.invitesDatabase, invitePath);
            onDisconnect(inviteRef).remove();
            await set(inviteRef, serverTimestamp()); // or serverTimestamp()
            const timeoutObj = setTimeout(()=>{
                off(inviteRef);
                set(inviteRef, null);
            }, timeout);
            onValue(inviteRef, (snapshot)=>{
                if (typeof snapshot.val() === 'number') return;
                if (snapshot.val() == null) {
                    off(inviteRef);
                    return;
                }
                // invite accepted
                const tradeRef = ref(this.tradingRoomDatabase, snapshot.val());
                off(tradeRef);
                clearTimeout(timeoutObj);
                resolve({
                    tradeRef,
                    amHosting: false
                });
                set(inviteRef, null);
            });
        });
    }
    leaveTrade({ tradeRef: tradeRef1 , amHosting  }) {
        return set(tradeRef1, null);
    }
    inviteUser(invitee3, inviter2) {
        return new Promise(async (resolve, reject)=>{
            const invitePath = invitee3 + "/" + (inviter2 || this.username) + "," + this.nationId + "," + this.uid;
            const inviteRef = ref(this.invitesDatabase, invitePath);
            onDisconnect(inviteRef).remove();
            await set(inviteRef, serverTimestamp()); // or serverTimestamp()
            onValue(inviteRef, (snapshot)=>{
                if (typeof snapshot.val() === 'number') return;
                if (snapshot.val() == null) {
                    off(inviteRef);
                    return;
                }
                // invite accepted
                const tradeRef = ref(this.tradingRoomDatabase, snapshot.val());
                off(tradeRef);
                resolve({
                    tradeRef,
                    amHosting: false
                });
                set(inviteRef, null);
            });
        });
    }
    acceptInvite(inviter3, invitee4) {
        return new Promise(async (resolve)=>{
            let timeStamp = Date.now();
            let inviteArr = new Array(20);
            for(let i = 7; i >= 0; i--){
                inviteArr[i] = timeChars.charAt(timeStamp % 64);
                timeStamp /= 64;
            }
            for(let i1 = 0; i1 < 12; i1++){
                inviteArr[8 + i1] = timeChars.charAt(getRandomInt(64));
            }
            const inviteStr = inviteArr.join("");
            const inviteRef = ref(this.invitesDatabase, (invitee4 || this.username) + "/" + inviter3);
            await set(inviteRef, inviteStr);
            const tradeRef = ref(this.tradingRoomDatabase, inviteStr);
            await update(tradeRef, {
                h: {
                    a: this.uid,
                    b: this.username,
                    c: '21',
                    d: [
                        'id176922',
                        'id176922'
                    ],
                    e: [
                        1,
                        1,
                        1,
                        1,
                        1,
                        1
                    ],
                    f: '',
                    g: '1 2 3',
                    h: '',
                    i: '',
                    j: '',
                    k: ''
                },
                H: {
                    x: ActionType1.loaded
                }
            });
            resolve({
                tradeRef,
                amHosting: true
            });
        });
    }
    doTrade({ tradeRef , amHosting: amHosting1  }, giver) {
        return new Promise(async (resolve, reject)=>{
            const otherProfile = amHosting1 ? "g" : "h";
            const otherAction = amHosting1 ? "G" : "H";
            const ownProfile = amHosting1 ? "h" : "g";
            const ownAction = amHosting1 ? "H" : "G";
            let loaded = false;
            let tradeReqTask = createTask();
            const self = this;
            // onDisconnect(tradeRef).remove();
            async function childUpdate(snapshot) {
                const snapshotVal = snapshot.val();
                if (snapshotVal === null) return;
                // console.log(snapshotVal);
                if (snapshot.key === otherProfile) {
                    tradeReqTask.finish(await giver(snapshotVal));
                    await update(tradeRef, {
                        [ownProfile]: {
                            a: self.uid,
                            b: self.username,
                            c: '21',
                            d: [
                                'id176922',
                                'id176922',
                                "id176922",
                                "id176922"
                            ],
                            e: [
                                1,
                                1,
                                1,
                                1,
                                1,
                                1
                            ],
                            f: '',
                            g: '1 2 3',
                            h: '',
                            i: '',
                            j: '',
                            k: ''
                        },
                        [ownAction]: {
                            x: ActionType1.loaded
                        },
                        ts: serverTimestamp()
                    });
                } else if (snapshot.key === otherAction) {
                    const tradeReq = await tradeReqTask.promise;
                    if (snapshotVal.x === ActionType1.loaded) {
                        loaded = true;
                        await sleep(500);
                        for(let i = 0; i < tradeReq.giveCards.length; i++){
                            await update(tradeRef, {
                                [ownAction]: {
                                    v: `${tradeReq.giveCards[i]},${i}`,
                                    x: ActionType1.putCard
                                }
                            });
                        }
                        for(let i2 = 0; i2 < tradeReq.givePacks.length; i2++){
                            await update(tradeRef, {
                                [ownAction]: {
                                    a: tradeReq.givePacks[i2].pack,
                                    b: tradeReq.givePacks[i2].amount,
                                    c: i2,
                                    x: ActionType1.putPack
                                }
                            });
                        }
                        await update(tradeRef, {
                            [ownAction]: {
                                v: Math.max(tradeReq.giveCoins, 0),
                                x: ActionType1.putCoins
                            }
                        });
                    } else if (snapshotVal.x === ActionType1.ready) {
                        await update(tradeRef, {
                            [ownAction]: {
                                x: ActionType1.unready
                            }
                        });
                        await update(tradeRef, {
                            [ownAction]: {
                                x: ActionType1.ready
                            }
                        });
                    } else if (snapshotVal.x === ActionType1.confirm) {
                        await update(tradeRef, {
                            [ownAction]: {
                                x: ActionType1.confirm
                            }
                        });
                    } else if (isTradeHandshake(snapshotVal)) {
                        const updates = [];
                        // a: cards I'm giving
                        // b: cards I'm getting
                        // c: packs I'm giving
                        // d: packs I'm getting
                        // e: net coins I'm getting
                        const newAction = {
                            x: ActionType1.handshake
                        };
                        const cardsGivenByOther = snapshotVal.a ?? [];
                        if (!tradeReq.receiveCards && cardsGivenByOther.length > 0) {
                            updates.push({
                                [ownAction]: {
                                    v: "61",
                                    x: ActionType1.sendEmoji
                                }
                            });
                        }
                        newAction.b = cardsGivenByOther;
                        const packsGivenByOther = snapshotVal.c ?? {
                        };
                        if (!tradeReq.receivePacks && Object.keys(packsGivenByOther).length > 0) {
                            updates.push({
                                [ownAction]: {
                                    v: "62",
                                    x: ActionType1.sendEmoji
                                }
                            });
                        }
                        newAction.d = packsGivenByOther;
                        const gottenCards = snapshotVal.b ?? []; // TODO: shortcut with alreadyUpdated
                        for(let i = 0, j = 0; i < tradeReq.giveCards.length; i++, j++){
                            if (tradeReq.giveCards[i] != gottenCards[j]) {
                                updates.push({
                                    [ownAction]: {
                                        v: `${tradeReq.giveCards[i]},${i}`,
                                        x: ActionType1.putCard
                                    }
                                });
                                j--;
                            }
                        }
                        newAction.a = tradeReq.giveCards;
                        const gottenPacks = snapshotVal.d ?? {
                        };
                        for(let i3 = 0, j1 = 0; i3 < tradeReq.givePacks.length; i3++, j1++){
                            if (!(tradeReq.givePacks[i3].pack in gottenPacks)) {
                                updates.push({
                                    [ownAction]: {
                                        a: tradeReq.givePacks[i3].pack,
                                        b: tradeReq.givePacks[i3].amount,
                                        c: i3,
                                        x: ActionType1.putPack
                                    }
                                });
                                gottenPacks[tradeReq.givePacks[i3].pack] = tradeReq.givePacks[i3].amount;
                                j1--;
                            }
                        }
                        newAction.c = gottenPacks;
                        let gottenCoins = snapshotVal.e ?? 0;
                        if (gottenCoins < tradeReq.giveCoins && !tradeReq.receiveCoins) {
                            updates.push({
                                [ownAction]: {
                                    v: Math.max(tradeReq.giveCoins, 0),
                                    x: ActionType1.putCoins
                                }
                            });
                            updates.push({
                                [ownAction]: {
                                    v: '00',
                                    x: ActionType1.wantCoinsMessage
                                }
                            });
                        }
                        newAction.e = -gottenCoins;
                        if (updates.length === 0) {
                            await update(tradeRef, {
                                [ownAction]: newAction
                            });
                            off(tradeRef);
                            resolve({
                                givenCards: newAction.a,
                                givenPacks: newAction.c,
                                netCoins: newAction.e,
                                receivedCards: newAction.b,
                                receivedPacks: newAction.d
                            });
                        } else {
                            await update(tradeRef, {
                                [ownAction]: {
                                    x: ActionType1.cancel
                                }
                            });
                            await sleep(2000);
                            for (const updateElem of updates){
                                await update(tradeRef, updateElem);
                            }
                        }
                    }
                }
            }
            onChildAdded(tradeRef, childUpdate);
            onChildChanged(tradeRef, childUpdate);
            onValue(tradeRef, async (snapshot)=>{
                // console.log(snapshotVal);
                if (snapshot.val() == null && loaded) {
                    off(tradeRef);
                }
            });
        });
    }

    
    
    
    
        constructor(token){
        this.loggedIn = false;
        this.token = token;
        this.app = initializeApp({
            apiKey: "AIzaSyB_EOvTR2kKCIpSXlBfeYGyDgTt3IVCH_I",
            authDomain: "amf22-room-ids.europe-west1.firebaseapp.com",
            projectId: "madfut-22a",
            storageBucket: "madfut-22a.appspot.com",
            messagingSenderId: "107131153807",
            databaseURL: "https://cmf22-trading-invites.europe-west1.firebasedatabase.app",
            appId: "1:107131153807:android:ed61bfe67793c245a2effa"
        });
        initializeAppCheck(this.app, {
            provider: new CustomProvider({
                getToken: ()=>{
                    return Promise.resolve({
                        token: this.token,
                        expireTimeMillis: 1637066608 * 1000 // TODO: read from token
                    });
                }
            })
        });
        this.auth = getAuth(this.app);
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
}
export default MadfutClient;
export { ProfileProperty1 as ProfileProperty };
