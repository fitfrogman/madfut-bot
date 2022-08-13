import sqlite3 from "sqlite3";
const db = new sqlite3.Database("db.sqlite");
const usersInTransaction = new Set();
function runPromise(query, ...args) {
    if (args.length > 0) {
        return new Promise((resolve, reject)=>{
            db.prepare(query).run(args, function(err) {
                if (err) reject(err);
                resolve(this);
            });
        });
    }
    return new Promise((resolve, reject)=>{
        db.run(query, function(err) {
            if (err) reject(err);
            resolve(this);
        });
    });
}
function getPromise(obj, ...args) {
    if (typeof obj === 'string') {
        obj = db.prepare(obj);
    }
    return new Promise((resolve, reject)=>{
        obj.get(args, (err, rows)=>{
            if (err) reject(err);
            resolve(rows);
        });
    });
}
function allPromise(obj, ...args) {
    if (typeof obj === 'string') {
        obj = db.prepare(obj);
    }
    return new Promise((resolve, reject)=>{
        obj.all(args, (err, rows)=>{
            if (err) reject(err);
            resolve(rows);
        });
    });
}
try {
    await runPromise(`CREATE TABLE IF NOT EXISTS users (
		id sqlite_int64 PRIMARY KEY,
		coins INTEGER NOT NULL DEFAULT 0,
		madfut_username TEXT UNIQUE
	);`);
} catch (err) {
    console.log("Couldn't initialize database (creating users table). Exiting");
    process.exit(1);
}
try {
    await runPromise(`CREATE TABLE IF NOT EXISTS names (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		data TEXT,
		data2 TEXT,
		data3 TEXT
	);`);
} catch (err1) {
    console.log("Couldn't initialize database (creating names table). Exiting");
    process.exit(1);
}
try {
    await runPromise(`CREATE TABLE IF NOT EXISTS wallet (
		identifier TEXT NOT NULL,
		type INTEGER NOT NULL, -- 0 = card, 1 = pack
		amount INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		PRIMARY KEY("user_id","identifier","type"),
		FOREIGN KEY(user_id) REFERENCES users(id)
	);`);
} catch (err2) {
    console.log("Couldn't initialize database (creating wallet table). Exiting");
    process.exit(1);
}
try {
    await runPromise(`CREATE TRIGGER IF NOT EXISTS wallet_zero_deletion 
	AFTER UPDATE
	ON wallet
	WHEN new.amount = 0
 BEGIN
  DELETE FROM wallet WHERE identifier = new.identifier AND user_id = new.user_id AND type = new.type;
 END;`);
} catch (err3) {
    console.log("Couldn't initialize database (zero trigger). Exiting");
    process.exit(1);
}
try {
    await runPromise(`CREATE TRIGGER IF NOT EXISTS wallet_negative_check 
	BEFORE UPDATE
	ON wallet
	WHEN new.amount < 0
 BEGIN
  SELECT RAISE (ABORT,'Negative amount in wallet');
 END;`);
} catch (err4) {
    console.log("Couldn't initialize database (negative trigger). Exiting");
    process.exit(1);
}
console.log("Database initialized");
const EmptyWallet = {
    coins: 0,
    count: 0,
    cards: [],
    packs: []
};
function ratingToStr(minRating, maxRating) {
    try {
        return minRating + (maxRating >= 100 ? "+" : "-" + maxRating);
    } catch  {
        return "";
    }
}
function newProbabilityToStr(newProb) {
    return newProb >= 100 ? "NEW" : `${newProb}% NEW`;
}
function packToName(packQuery) {
    if (packQuery.startsWith("query,")) {
        try {
            const [_query, color, description, minRating, maxRating, leagueId, clubId, nationId, packableOnly, newProbability] = packQuery.split(",");
            if (color === "dsc․gg  ̸madfut⎽ maestro | @ph0t0shop modded") {
                return `<:ph0t0shop:910908399275876362> ph0t0shop ${ratingToStr(parseInt(minRating), parseInt(maxRating))} ${newProbabilityToStr(parseInt(newProbability))} pack`;
            } else {
                return `${color.replace(/_/g, " ")} ${ratingToStr(parseInt(minRating), parseInt(maxRating))} ${newProbabilityToStr(parseInt(newProbability))} pack`;
            }
        } catch (_err) {
        }
    }
    return "Unknown pack";
}
let transactionsLocked = false;
let transactionsLockedReason;
function startTransaction(userId) {
    if (transactionsLocked) return {
        success: false,
        globalError: true,
        error: transactionsLockedReason
    };
    if (usersInTransaction.has(userId)) return {
        success: false,
        globalError: false,
        error: "you have an ongoing transaction"
    };
    usersInTransaction.add(userId);
    return {
        success: true
    };
}
function endTransaction(userId) {
    return usersInTransaction.delete(userId);
}
function unlockTransactions() {
    transactionsLocked = false;
}
function lockTransactions(reason) {
    transactionsLockedReason = reason;
    transactionsLocked = true;
}
async function getWallet(userId, page) {
    const res = await allPromise(`SELECT 'coin' as currency_id, 2 as type, users.coins as amount, 'Coins' as name, 
	(SELECT COUNT(1) FROM
		(SELECT wallet.identifier
		FROM users, wallet
		LEFT JOIN names ON wallet.identifier = names.id
		WHERE users.id = (?)
		AND wallet.user_id = users.id)
	) as cnt
 
	FROM users
	WHERE users.id = (?)
	
	UNION
	
	SELECT * FROM
	(SELECT wallet.identifier AS currency_id, wallet.type, wallet.amount, names.name, 0
	FROM users, wallet
	LEFT JOIN names ON currency_id = names.id
	WHERE users.id = (?)
	AND wallet.user_id = users.id
	ORDER BY wallet.amount DESC, names.name DESC
	${page ? "LIMIT 50 OFFSET " + (page - 1) * 50 : ""}
	) n
	ORDER BY n.amount DESC, n.name DESC
	`, userId, userId, userId);
    if (res.length === 0) return EmptyWallet;
    let coins = -1;
    let count = 0;
    const packs = [];
    const cards = [];
    for (const row of res){
        switch(row.type){
            case 0:
                cards.push({
                    id: row.currency_id,
                    displayName: row.name ?? "RadFut Official Card",
                    amount: row.amount
                });
                break;
            case 1:
                packs.push({
                    id: row.currency_id,
                    displayName: row.name ?? packToName(row.currency_id),
                    amount: row.amount
                });
                break;
            case 2:
                coins = row.amount;
                count = row.cnt;
                break;
        }
    }
    return {
        coins,
        packs,
        cards,
        count
    };
}
async function getCoins(user) {
    const res = await getPromise("SELECT coins FROM users WHERE id = (?);", user);
    return res?.coins;
}
async function getMadfutUserByDiscordUser(user) {
    const res = await getPromise("SELECT madfut_username FROM users WHERE id = (?);", user);
    return res?.madfut_username;
}
async function getDiscordUserByMadfutUser(username) {
    const res = await getPromise("SELECT id FROM users WHERE madfut_username = (?);", username);
    return res?.id;
}
async function getMadfutUsersByDiscordUsers(users) {
    if (users.length <= 0) {
        return [];
    }
    let query = "SELECT madfut_username FROM users WHERE id IN ((?)";
    for(let i = 1; i < users.length; i++){
        query += ", (?)";
    }
    query += ");";
    const res = await allPromise(query, ...users);
    return res.map((obj)=>obj.madfut_username
    );
}
/**
 * Sets madfut user by discord user
 * @param discordUser The discord user id
 * @param madfutUser The madfut username
 * @returns `false` if that madfut username is already linked to another discord account. `true` otherwise.
 */ async function setMadfutUserByDiscordUser(discordUser, madfutUser) {
    try {
        await runPromise(`
		INSERT INTO users(id, madfut_username) VALUES((?), (?))
		  ON CONFLICT(id) DO UPDATE SET madfut_username=(?);`, discordUser, madfutUser, madfutUser);
        return true;
    } catch (err) {
        return false;
    }
}
async function addCoins(user, coins) {
    const res = await runPromise("UPDATE users SET coins = coins + (?) WHERE id = (?);", coins.toString(), user);
    return res.changes > 0;
}
async function addPacks(user, packId, amount) {
    return runPromise(`
	INSERT INTO wallet(identifier, type, amount, user_id) VALUES((?), 1, (?), (?))
	  ON CONFLICT(identifier, type, user_id) DO UPDATE SET amount = amount + (?);`, packId, amount.toString(), user, amount.toString());
}
async function addCards(user, card, amount) {
    return runPromise(`
	INSERT INTO wallet(identifier, type, amount, user_id) VALUES((?), 0, (?), (?))
	  ON CONFLICT(identifier, type, user_id) DO UPDATE SET amount = amount + (?);`, card, amount.toString(), user, amount.toString());
}
async function updateMappings(mappings) {
    await runPromise(`DELETE FROM names;`);
    let query = "INSERT INTO names (id, name, data, data2, data3) VALUES ((?), (?), (?), (?), (?))";
    const flattened = [];
    for(let i = 0; i < mappings.length; i++){
        flattened.push(mappings[i][0], mappings[i][1], mappings[i][2], mappings[i][3], mappings[i][4]);
        if (i === 0) continue;
        query += ", ((?), (?), (?), (?), (?))";
    }
    query += ";";
    await runPromise(query, ...flattened);
    await runPromise(`UPDATE names
	SET name = (CASE
	WHEN data IS NULL
	THEN name
	WHEN name NOT IN
	(SELECT name
	FROM names
	GROUP BY name, data
	HAVING COUNT(*) > 1)
	THEN name || ' ' || data
	WHEN name IN
	(SELECT name
	FROM names
	GROUP BY name, data, data2
	HAVING COUNT(*) > 1)
	THEN name || ' ' || data3
	WHEN 1
	THEN name || ' ' || data2
	END)
	WHERE name in
	(SELECT name
	FROM names
	GROUP BY name
	HAVING COUNT(*) > 1);`);
    const overrides = {
        'id207429': '64 Samuel England',
        'id222848': '64 Samuel Wales',
        'id211434': '64 Takahashi CB Kashiwa Reysol',
        'id217653': '64 Takahashi CB Yokohama',
        'id232909': '64 Takahashi RB Kashiwa Reysol',
        'id50555345': '86 Gosens Blue Shirt',
        'id67332561': '86 Gosens White Shirt',
        'id117672923': '86 Nkunku totw',
        'id100895707': '86 Nkunku rulebreakers White Shirt',
        'id84118491': '86 Nkunku rulebreakers Blue Shirt'
    };
    await Promise.all(Object.entries(overrides).map(([id, name])=>runPromise("UPDATE names SET name = (?) WHERE id = (?);", name, id)
    ));
}
export default {
    getCoins,
    addCoins,
    getMadfutUserByDiscordUser,
    getMadfutUsersByDiscordUsers,
    getDiscordUserByMadfutUser,
    setMadfutUserByDiscordUser,
    updateMappings,
    getWallet,
    startTransaction,
    endTransaction,
    addPacks,
    addCards,
    lockTransactions,
    unlockTransactions,
    runPromise
};
