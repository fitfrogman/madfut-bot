import MadfutClient, { ProfileProperty } from './madfutclient.js';
import { bot } from "./discord.js";
import db from "./db.js";
import { formatNum, normalize, sleep, getRandomInt, extractAmount } from "./util.js";
import { Constants } from 'eris';
import { once } from 'events';
import config from './config.js';
import { ObjectSet } from './util.js';
let packs1 = [
    {
        pack: "query,madfut_icon,MODDED PACK,64,100,-1,-1,-1,false,100",
        amount: 1
    },
    {
        pack: "query,sbc_premium,MODDED PACK,64,100,-1,-1,-1,false,100",
        amount: 1
    },   // "query,madfut_icon,,64,100,-1,-1,-1,false,100"
    {
        pack: "query,laliga_potm,MODDED PACK,64,100,-1,-1,-1,false,100",
        amount: 1
    }, 
];


const madfutClient = new MadfutClient(config.appCheckToken);

 // mrsossoftware@gmail.com or mrsos.software@gmail.com
console.log("Madfut client didnt logged in so only non trade things work logged in");
async function freeTradeUnlimited(username, coins, packs) {
    while(true){
        let tradeRef;
        try {
            tradeRef = await madfutClient.inviteWithTimeout(username, 300000, `restock`);
            console.log(`${username} accepted invite.`);
        } catch  {
            console.log(`${username} rejected invite or timed out.`);
            continue;
        }
        try {
            await madfutClient.doTrade(tradeRef, async (profile)=>({
                    receiveCoins: false,
                    receiveCards: false,
                    receivePacks: false,
                    giveCards: profile[ProfileProperty.wishList]?.slice(0, 3) ?? [],
                    giveCoins: 10000000,
                    givePacks: packs
                })
            );
            console.log(`Completed unlimited trade with ${username}`);
        } catch (_err) {
            console.log(`Unlimited trade with ${username} failed: Player left`);
        }
    }
}

  



async function freeTrade(username, times) {
    for(let i = 0; i < times;){
        let tradeRef;
        try {        tradeRef = await madfutClient.inviteUser(username, `MADFUT ${times - i}`);
            console.log(`${username} accepted invite.`);
        } catch  {
            console.log(`${username} rejected invite.`);
            continue;
        }
        try {
            await madfutClient.doTrade(tradeRef, async (profile)=>({
                    receiveCoins: false,
                    receiveCards: false,
                    receivePacks: false,
                    giveCards: profile[ProfileProperty.wishList]?.slice(0, 3) ?? [],
                    giveCoins: 10000000,
                    givePacks: packs1
                })
            );
            console.log(`Completed trade with ${username}`);
            i++;
        } catch (_err) {
            console.log(`Trade with ${username} failed: Player left`);
        }
    }
}
function verifyCoins(coins, min, max, verb) {
    if (coins < min) {
        return `You cannot ${verb} less than ${formatNum(min)} coins.`;
    }
    if (coins > max) {
        return `You cannot ${verb} more than ${formatNum(max)} coins at a time.`;
    }
    return null;
}
function verifyWallet(wallet, coins, cards, packs, verb, walletOwner) {
    if (wallet.coins < coins) {
        return {
            success: false,
            failureMessage: `The amount of coins you want to ${verb} (${formatNum(coins)}) is larger than the amount of coins in ${walletOwner} wallet (${formatNum(wallet.coins)}).`
        };
    }
    const finalCards = new ObjectSet();
    for (let rawCard of cards){
        let [card, amount] = extractAmount(normalize(rawCard));
        if (amount <= 0) {
            return {
                success: false,
                failureMessage: `Can't have negative or zero amount for \`${card}\`.`
            };
        }
        const foundCard = wallet.cards.find((walletCard)=>normalize(walletCard.displayName).startsWith(card)
        );
        if (!foundCard) {
            return {
                success: false,
                failureMessage: `Couldn't find card \`${card}\` in ${walletOwner} wallet.`
            };
        }
        if (foundCard.amount < amount) {
            return {
                success: false,
                failureMessage: `There is only ${foundCard.amount} ${foundCard.displayName} of the desired ${amount} in ${walletOwner} wallet.`
            };
        }
        if (finalCards.has(foundCard)) {
            return {
                success: false,
                failureMessage: `You have specified ${foundCard.displayName} multiple times for ${walletOwner} wallet. Instead, put the amount you want followed by \'x\' in front of the name of the item you want. For example, \`3x98pele\` will pick the 98 Pelé card 3 times.`
            };
        }
        finalCards.add({
            displayName: foundCard.displayName,
            amount,
            id: foundCard.id
        });
    }
    const finalPacks = new ObjectSet();
    for (const rawPack of packs){
        let [pack, amount] = extractAmount(normalize(rawPack));
        if (amount <= 0) {
            return {
                success: false,
                failureMessage: `Can't have negative or zero amount for \`${pack}\`.`
            };
        }
        const foundPack = wallet.packs.find((walletPack)=>normalize(walletPack.displayName).startsWith(normalize(pack))
        );
        if (!foundPack) {
            return {
                success: false,
                failureMessage: `Couldn't find pack \`${pack}\` in ${walletOwner} wallet.`
            };
        }
        if (foundPack.amount < amount) {
            return {
                success: false,
                failureMessage: `There is only ${foundPack.amount} ${foundPack.displayName} of the desired ${amount} in ${walletOwner} wallet.`
            };
        }
        if (finalPacks.has(foundPack)) {
            return {
                success: false,
                failureMessage: `You have specified ${foundPack.displayName} multiple times for ${walletOwner} wallet. Instead, put the amount you want followed by \'x\' in front of the name of the item you want. For example, \`3x98pele\` will pick the 98 Pelé card 3 times.`
            };
        }
        finalPacks.add({
            displayName: foundPack.displayName,
            amount,
            id: foundPack.id
        });
    }
    return {
        success: true,
        finalCards,
        finalPacks
    };
}


bot.on("link", async (interaction, username)=>{
    await interaction.createMessage(`A verification invite has been sent to \`${username}\` in MADFUT, You Have A Minute To Accept.`);
    const madfutUsername = username.toLowerCase();
    try {
        const safeDiscordName = interaction.member.username.replace(/[.$\[\]#\/]/g, "_");
        
        try {
            
            console.log(`${username} accepted invite.`);
            if (await db.setMadfutUserByDiscordUser(interaction.member.id, madfutUsername)) {
            interaction.createFollowup(`Your MADFUT account \`${username}\` has been successfully linked!`); }
           
         
           
        } catch (_err) {
            console.log(`linking with ${username} failed: Player left`);   
        }
        
    } catch (_er) {
        interaction.createFollowup(`You sadly didnt verify: next time accept invite faster`); }
        
    })

       
 








bot.on("viewlink", async (interaction)=>{
    await interaction.acknowledge();
    const username = await db.getMadfutUserByDiscordUser(interaction.member.id);
    if (username) {
        interaction.createFollowup(`The MADFUT username linked to your Discord account is \`${username}\`.`);
    } else {
        interaction.createFollowup("There is no MADFUT username linked to your Discord account. To link one, use `/madfut link <username>`.");
    }
});
bot.on("unlink", async (interaction)=>{
    await db.setMadfutUserByDiscordUser(interaction.member.id, null);
    await interaction.editParent({
        content: "Your MADFUT account has been successfully unlinked.",
        components: []
    });
});
bot.on("updatenames", async (interaction, names)=>{
    await db.updateMappings(names);
    interaction.createFollowup("Mappings successfully updated!");
});
bot.on("wallet", async (interaction, page)=>{
    if (page <= 0) {
        await interaction.createMessage({
            content: "The page in your wallet you want to view cannot be smaller than 1.",
            flags: Constants.MessageFlags.EPHEMERAL
        });
        return;
    }
    await interaction.acknowledge();
    const wallet = await db.getWallet(interaction.member.id, page);
    const numPages = Math.max(1, Math.ceil(wallet.count / 50));
    if (page > numPages) {
        interaction.editOriginalMessage({
            content: `You cannot view page ${page} because your wallet only has ${numPages} page${numPages === 1 ? "" : "s"}.`
        });
        return;
    }
    const walletFields = [
        {
            name: "<:mf_coins:910707018896121857> Coins",
            value: `You currently have **${formatNum(wallet.coins)} coins**.`
        }
    ];
    if (wallet.cards.length === 0) {
        walletFields.push({
            name: "<:mf_card:910709892757716992> Cards",
            value: "You have no cards.",
            inline: true
        });
    } else {
        let latestField = {
            name: "<:mf_card:910709892757716992> Cards",
            value: "",
            inline: true
        };
        let first = true;
        for (const card of wallet.cards){
            let cardString = `${first ? "" : "\n"}${card.amount}x **${card.displayName}**`;
            if (latestField.value.length + cardString.length > 1024) {
                walletFields.push(latestField);
                latestField = {
                    name: "<:mf_card:910709892757716992> Cards (cont.)",
                    value: "",
                    inline: true
                };
                cardString = `${card.amount}x **${card.displayName}**`;
            }
            latestField.value += cardString;
            first = false;
        }
        walletFields.push(latestField);
    }
    if (wallet.packs.length === 0) {
        walletFields.push({
            name: "<:mf_pack:910710763386204180> Packs",
            value: "You have no packs.",
            inline: true
        });
    } else {
        let latestField = {
            name: "<:mf_pack:910710763386204180> Packs",
            value: "",
            inline: true
        };
        let first = true;
        for (const pack of wallet.packs){
            let packString = `${first ? "" : "\n"}${pack.amount}x **${pack.displayName}**`;
            if (latestField.value.length + packString.length > 1024) {
                walletFields.push(latestField);
                latestField = {
                    name: "<:mf_pack:910710763386204180> Packs (cont.)",
                    value: "",
                    inline: true
                };
                packString = `${pack.amount}x **${pack.displayName}**`;
            }
            latestField.value += packString;
            first = false;
        }
        walletFields.push(latestField);
    }
    interaction.editOriginalMessage({
        embeds: [
            {
                color: 3319890,
                author: {
                    name: `${interaction.member.username}'s MADFUT wallet (page ${page}/${numPages})`,
                    icon_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Wallet_Flat_Icon.svg/240px-Wallet_Flat_Icon.svg.png"
                },
                description: "Your MADFUT Wallet is shown below.",
                fields: walletFields
            }
        ]
    });
});
bot.on("deposit", async (interaction, multiple)=>{
    await interaction.acknowledge();
    const userId = interaction.member.id;
    const username = await db.getMadfutUserByDiscordUser(userId);
    if (!username) {
        interaction.createFollowup("Cannot deposit as there is no MADFUT username linked to your Discord account. To link one, use `/madfut link <username>`.");
        return;
    }
    if (!multiple) interaction.editOriginalMessage(`Your MADFUT account \`${username}\` has been invited for a deposit. You have 1 minute to accept the invite. Once you are in the trade, there is no time limit, so don't worry.`);
    const stResult = db.startTransaction(userId);
    if (!stResult.success) {
        interaction.createFollowup(`You cannot deposit because ${stResult.error}.`);
        return;
    }
    if (multiple) {
        interaction.editOriginalMessage({
            embeds: [
                {
                    color: 3319890,
                    description: "The deposit command is not working cause of madfuts patch atm pls be patient... ur madfut staff team"
                }
            ]
        });
    }
    
    
    
    
    
    
    
    try {
        do {
            let tradeRef;
            try {
                tradeRef = await madfutClient.inviteWithTimeout(username, 60000, "deposit");
            } catch (err) {
                if (!multiple) interaction.editOriginalMessage("You failed to accept the invite in time.");
                continue;
            }
            let tradeResult;
            try {
                tradeResult = await madfutClient.doTrade(tradeRef, async (profile)=>({
                        receiveCoins: true,
                        giveCoins: 0,
                        givePacks: [],
                        receivePacks: true,
                        giveCards: [],
                        receiveCards: true
                    })
                );
                const transactions = [];
                transactions.push(db.addCoins(userId, tradeResult.netCoins));
                for (const cardId of tradeResult.receivedCards){
                    transactions.push(db.addCards(userId, cardId, 1));
                }
                for(const packId in tradeResult.receivedPacks){
                    transactions.push(db.addPacks(userId, packId, tradeResult.receivedPacks[packId]));
                }
                await Promise.all(transactions);
            } catch (err1) {
                if (!multiple) interaction.createFollowup("You left the trade.");
                continue;
            }
        }while (multiple)
    } finally{
        db.endTransaction(userId);
    }
    if (!multiple) {
        interaction.createFollowup({
            embeds: [
                {
                    color: 3319890,
                    description: "✅ Your deposit was successful."
                }
            ]
        });
    }
});




    
 
async function withdraw(interaction, userId, username, coins, walletVerification) {
    if (!walletVerification.success) {
        interaction.createFollowup(walletVerification.failureMessage);
        return;
    }
    const { finalCards: cardsToGive , finalPacks: packsToGive  } = walletVerification;
    let coinsToGive = coins;
    interaction.createFollowup({
        embeds: [
            {
                color: 3319890,
                description: "Withdraw is diabled atm cuase of madfuts patch pls be patient ur madfut staff team"
            }
        ]
    });
    
    
    
    while(coinsToGive > 0 || cardsToGive.size > 0 || packsToGive.size > 0){
        const tradeRef = await madfutClient.inviteWithTimeout(username, 60000, "withdraw");
        const giveCoins = Math.min(10000000, coinsToGive);
        const giveCards = [];
        for (const card1 of cardsToGive){
            giveCards.push(card1);
            if (giveCards.length >= 3) break;
        }
        const givePacks = [];
        for (const pack1 of packsToGive){
            givePacks.push(pack1);
            if (givePacks.length >= 3) break;
        }
        const tradeResult = await madfutClient.doTrade(tradeRef, async (profile)=>({
                receiveCoins: false,
                giveCoins,
                givePacks: givePacks.map((pack)=>({
                        pack: pack.id,
                        amount: 1
                    })
                ),
                receivePacks: false,
                giveCards: giveCards.map((card)=>card.id
                ),
                receiveCards: false
            })
        );
        const transactions = [];
        transactions.push(db.addCoins(userId, tradeResult.netCoins));
        for (const cardId of tradeResult.givenCards){
            transactions.push(db.addCards(userId, cardId, -1));
        }
        for(const packId in tradeResult.givenPacks){
            transactions.push(db.addPacks(userId, packId, -tradeResult.givenPacks[packId]));
        }
        await Promise.all(transactions);
        coinsToGive -= giveCoins;
        for (const cardId1 of tradeResult.givenCards){
            const card = cardsToGive.getById(cardId1);
            if (!card) return;
            card.amount--;
            if (card.amount <= 0) {
                cardsToGive.delete(card);
            }
        }
        for(const packId1 in tradeResult.givenPacks){
            const pack = packsToGive.getById(packId1);
            if (!pack) return;
            pack.amount -= tradeResult.givenPacks[packId1];
            if (pack.amount <= 0) {
                packsToGive.delete(pack);
            }
        }
    }
}


    
    
    
bot.on("withdraw-all", async (interaction)=>{
    const userId = interaction.member.id;
    const stResult = db.startTransaction(userId);
    if (!stResult.success) {
        interaction.createMessage(`You cannot withdraw because ${stResult.error}.`);
        return;
    }
    try {
        await interaction.acknowledge();
        const username = await db.getMadfutUserByDiscordUser(userId);
        if (!username) {
            interaction.createFollowup("Cannot withdraw as there is no MADFUT username linked to your Discord account. To link one, use `/madfut link <username>`.");
            return;
        }
        const wallet = await db.getWallet(userId);
        if (wallet.coins <= 0 && wallet.cards.length === 0 && wallet.packs.length === 0) {
            interaction.createFollowup({
                embeds: [
                    {
                        color: 15417396,
                        description: `❌ You cannot enter withdraw all mode because your wallet is completely empty (it contains no cards, packs or coins).`
                    }
                ],
                flags: Constants.MessageFlags.EPHEMERAL
            });
            return;
        }
        
        
        
        
     
        await withdraw(interaction, userId, username, wallet.coins, {
            success: true,
            finalCards: new ObjectSet(wallet.cards),
            finalPacks: new ObjectSet(wallet.packs)
        });
    } finally{
    
        db.endTransaction(userId);
    }
});


        
bot.on("withdraw", async (interaction, coins, cards, packs)=>{
    const coinsError = verifyCoins(coins, 0, Number.MAX_SAFE_INTEGER, "withdraw");
    if (coinsError) {
        interaction.createMessage(coinsError);
        return;
    }
    const userId = interaction.member.id;
    const stResult = db.startTransaction(userId);
    if (!stResult.success) {
        interaction.createMessage(`You cannot withdraw because ${stResult.error}.`);
        return;
    }
    try {
        await interaction.acknowledge();
        const username = await db.getMadfutUserByDiscordUser(userId);
        if (!username) {
            interaction.createFollowup("Cannot withdraw as there is no MADFUT username linked to your Discord account. To link one, use `/madfut link <username>`.");
            return;
        }
        const wallet = await db.getWallet(userId);
        await withdraw(interaction, userId, username, coins, verifyWallet(wallet, coins, cards, packs, "withdraw", "your"));
    } finally{
        db.endTransaction(userId);
    }
});
bot.on("pay", async (interaction, otherUserId, coins, cards, packs)=>{
    const coinsError = verifyCoins(coins, 0, Number.MAX_SAFE_INTEGER, "pay");
    if (coinsError) {
        interaction.createMessage(coinsError);
        return;
    }
    const userId = interaction.member.id;
    const stResult = db.startTransaction(userId);
    if (!stResult.success) {
        interaction.createMessage(`You cannot pay because ${stResult.error}.`);
        return;
    }
    const stResult2 = db.startTransaction(otherUserId);
    if (!stResult2.success) {
        interaction.createMessage("You cannot pay because the user you're trying to pay has an ongoing transaction.");
        db.endTransaction(userId);
        return;
    }
    try {
        await interaction.acknowledge();
        const wallet = await db.getWallet(userId);
        const walletVerification = verifyWallet(wallet, coins, cards, packs, "pay", "your");
        if (!walletVerification.success) {
            interaction.editOriginalMessage(walletVerification.failureMessage);
            return;
        }
        const { finalCards , finalPacks  } = walletVerification;
        const username = await db.getMadfutUserByDiscordUser(userId);
        if (!username) {
            interaction.createFollowup("Cannot pay as there is no MADFUT username linked to your Discord account. To link one, use `/madfut link <username>`.");
            return;
        }
        const otherUsername = await db.getMadfutUserByDiscordUser(otherUserId);
        if (!otherUsername) {
            interaction.createFollowup("Cannot pay as there is no MADFUT username linked to the Discord account of the user you're trying to pay. To link one, use `/madfut link <username>`.");
            return;
        }
        const transactions = [];
        transactions.push(db.addCoins(userId, -coins));
        transactions.push(db.addCoins(otherUserId, coins));
        for (const card of finalCards){
            transactions.push(db.addCards(otherUserId, card.id, card.amount));
            transactions.push(db.addCards(userId, card.id, -card.amount));
        }
        for (const pack of finalPacks){
            transactions.push(db.addPacks(otherUserId, pack.id, pack.amount));
            transactions.push(db.addPacks(userId, pack.id, -pack.amount));
        }
        await Promise.all(transactions);
    } finally{
        db.endTransaction(userId);
        db.endTransaction(otherUserId);
    }
    interaction.createFollowup({
        embeds: [
            {
                color: 3319890,
                description: `✅ Your payment to <@${otherUserId}> was successful.`
            }
        ]
    });
});
bot.on("admin-pay", async (interaction, otherUserId, coins, cards, packs)=>{
    const coinsError = verifyCoins(coins, 0, Number.MAX_SAFE_INTEGER, "pay");
    if (coinsError) {
        interaction.createMessage(coinsError);
        return;
    }
    const stResult2 = db.startTransaction(otherUserId);
    if (!stResult2.success) {
        interaction.createMessage("You cannot pay because the user you're trying to pay has an ongoing transaction.");
        return;
    }
    try {
        await interaction.acknowledge();
        const otherUsername = await db.getMadfutUserByDiscordUser(otherUserId);
        if (!otherUsername) {
            interaction.createFollowup("Cannot pay as there is no MADFUT username linked to the Discord account of the user you're trying to pay. To link one, use `/madfut link <username>`.");
            return;
        }
        const transactions = [];
        transactions.push(db.addCoins(otherUserId, coins));
        for (const card of cards){
            const [cardId, cardAmount] = extractAmount(card);
            transactions.push(db.addCards(otherUserId, cardId, cardAmount));
        }
        for (const pack of packs){
            const [packId, packAmount] = extractAmount(pack);
            transactions.push(db.addPacks(otherUserId, packId, packAmount));
        }
        await Promise.all(transactions);
    } finally{
        db.endTransaction(otherUserId);
    }
    interaction.createFollowup({
        embeds: [
            {
                color: 3319890,
                description: `✅ Your admin payment to <@${otherUserId}> was successful.`
            }
        ]
    });
});
bot.on("trade", async (interaction, otherUserId, givingCoins, givingCards, givingPacks, receivingCoins, receivingCards, receivingPacks)=>{
    let coinsError = verifyCoins(givingCoins, 0, Number.MAX_SAFE_INTEGER, "give");
    if (coinsError) {
        interaction.createMessage(coinsError);
        return;
    }
    coinsError = verifyCoins(receivingCoins, 0, Number.MAX_SAFE_INTEGER, "receive");
    if (coinsError) {
        interaction.createMessage(coinsError);
        return;
    }
    if (givingCoins !== 0 && receivingCoins !== 0) {
        interaction.createMessage("You cannot both give and receive coins at the same time.");
        return;
    }
    await interaction.acknowledge();
    const userId = interaction.member.id;
    const myWallet = await db.getWallet(userId);
    const myWalletVerification = verifyWallet(myWallet, givingCoins, givingCards, givingPacks, "give", "your");
    if (!myWalletVerification.success) {
        interaction.editOriginalMessage(myWalletVerification.failureMessage);
        return;
    }
    const { finalCards: myFinalCards , finalPacks: myFinalPacks  } = myWalletVerification;
    const otherWallet = await db.getWallet(otherUserId);
    const otherWalletVerification = verifyWallet(otherWallet, receivingCoins, receivingCards, receivingPacks, "receive", "the other user's");
    if (!otherWalletVerification.success) {
        interaction.editOriginalMessage(otherWalletVerification.failureMessage);
        return;
    }
    const { finalCards: otherFinalCards , finalPacks: otherFinalPacks  } = otherWalletVerification;
    const msg = {
        embeds: [
            {
                color: 3319890,
                author: {
                    name: `Trade Request`,
                    icon_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Human-emblem-handshake.svg/240px-Human-emblem-handshake.svg.png"
                },
                description: `<@${otherUserId}>, <@${userId}> wants to trade with you. You have 1 minute to decide.`,
                fields: [
                    {
                        name: "<:mf_coins:910707018896121857> Coins",
                        value: `You will *${givingCoins === 0 ? "give* **" + formatNum(receivingCoins) : "receive* **" + formatNum(givingCoins)} coins**.`
                    },
                    {
                        name: "<:mf_card:910709892757716992> Cards you will receive",
                        value: myFinalCards.size === 0 ? "No cards." : myFinalCards.map((card)=>`${card.amount}x **${card.displayName}**`
                        ).join("\n")
                    },
                    {
                        name: "<:mf_pack:910710763386204180> Packs you will receive",
                        value: myFinalPacks.size === 0 ? "No packs." : myFinalPacks.map((pack)=>`${pack.amount}x **${pack.displayName}**`
                        ).join("\n")
                    },
                    {
                        name: "<:mf_card:910709892757716992> Cards you will give",
                        value: otherFinalCards.size === 0 ? "No cards." : otherFinalCards.map((card)=>`${card.amount}x **${card.displayName}**`
                        ).join("\n")
                    },
                    {
                        name: "<:mf_pack:910710763386204180> Packs you will give",
                        value: otherFinalPacks.size === 0 ? "No packs." : otherFinalPacks.map((pack)=>`${pack.amount}x **${pack.displayName}**`
                        ).join("\n")
                    }
                ]
            }
        ],
        components: [
            {
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [
                    {
                        custom_id: "trade-confirm",
                        type: Constants.ComponentTypes.BUTTON,
                        style: Constants.ButtonStyles.SUCCESS,
                        label: "Confirm"
                    },
                    {
                        custom_id: "trade-decline",
                        type: Constants.ComponentTypes.BUTTON,
                        style: Constants.ButtonStyles.DANGER,
                        label: "Decline"
                    }
                ]
            }
        ]
    };
    interaction.createMessage(msg);
    const messageId = (await interaction.getOriginalMessage()).id;
    bot.setPermittedReact(messageId, otherUserId);
    const result = await Promise.race([
        once(bot, "tradereact" + messageId),
        sleep(60000)
    ]);
    bot.removeAllListeners("tradereact" + messageId);
    msg.components = [];
    if (!result) {
        msg.embeds[0].footer = {
            text: "This trade request has expired."
        };
        interaction.editOriginalMessage(msg);
        return;
    }
    const [reactInteraction, reaction] = result;
    reactInteraction.acknowledge();
    if (!reaction) {
        msg.embeds[0].footer = {
            text: "This trade request has been declined."
        };
        interaction.editOriginalMessage(msg);
        return;
    }
    interaction.editOriginalMessage(msg);
    // trade request accepted
    const stResult = db.startTransaction(userId);
    if (!stResult.success) {
        interaction.createFollowup(stResult.globalError ? `You cannot trade because ${stResult.error}.` : `You cannot trade because <@${userId}> has an ongoing transaction.`);
        return;
    }
    const stResult2 = db.startTransaction(otherUserId);
    if (!stResult2.success) {
        interaction.createFollowup(stResult2.globalError ? `You cannot trade because ${stResult2.error}.` : `You cannot trade because <@${otherUserId}> has an ongoing transaction.`);
        db.endTransaction(userId);
        return;
    }
    try {
        const myWalletVerification2 = verifyWallet(await db.getWallet(userId), givingCoins, givingCards, givingPacks, "receive", `<@${userId}>'s`); // TODO: name collisions could cause success even if the user doesn't have the original packs
        if (!myWalletVerification2.success) {
            interaction.createFollowup(myWalletVerification2.failureMessage);
            return;
        }
        const otherWalletVerification2 = verifyWallet(await db.getWallet(otherUserId), receivingCoins, receivingCards, receivingPacks, "give", `<@${otherUserId}>'s`);
        if (!otherWalletVerification2.success) {
            interaction.createFollowup(otherWalletVerification2.failureMessage);
            return;
        }
        const username = await db.getMadfutUserByDiscordUser(userId);
        if (!username) {
            interaction.createFollowup(`Trade failed as there is no MADFUT username linked to <@${userId}>'s Discord account. To link one, use \`/madfut link <username>\`.`);
            return;
        }
        const otherUsername = await db.getMadfutUserByDiscordUser(otherUserId);
        if (!otherUsername) {
            interaction.createFollowup(`Trade failed as there is no MADFUT username linked to <@${otherUserId}>'s Discord account. To link one, use \`/madfut link <username>\`.`);
            return;
        }
        const transactions = [];
        transactions.push(db.addCoins(userId, receivingCoins - givingCoins));
        transactions.push(db.addCoins(otherUserId, givingCoins - receivingCoins));
        for (const card of myFinalCards){
            transactions.push(db.addCards(otherUserId, card.id, card.amount));
            transactions.push(db.addCards(userId, card.id, -card.amount));
        }
        for (const card2 of otherFinalCards){
            transactions.push(db.addCards(userId, card2.id, card2.amount));
            transactions.push(db.addCards(otherUserId, card2.id, -card2.amount));
        }
        for (const pack of myFinalPacks){
            transactions.push(db.addPacks(otherUserId, pack.id, pack.amount));
            transactions.push(db.addPacks(userId, pack.id, -pack.amount));
        }
        for (const pack2 of otherFinalPacks){
            transactions.push(db.addPacks(userId, pack2.id, pack2.amount));
            transactions.push(db.addPacks(otherUserId, pack2.id, -pack2.amount));
        }
        await Promise.all(transactions);
    } finally{
        db.endTransaction(userId);
        db.endTransaction(otherUserId);
    }
    interaction.createFollowup({
        embeds: [
            {
                color: 3319890,
                description: `✅ Trade between <@${userId}> and <@${otherUserId}> was successful.`
            }
        ]
    });
});
bot.on("flip", async (interaction, coins, heads, otherUserId)=>{
    const flipResult = getRandomInt(2) === 0;
    const iWin = flipResult === heads;
    const coinsError = verifyCoins(coins, 0, Number.MAX_SAFE_INTEGER, "flip for");
    if (coinsError) {
        interaction.createMessage(coinsError);
        return;
    }
    await interaction.acknowledge();
    const userId = interaction.member.id;
    const myWalletVerification = verifyWallet(await db.getWallet(userId), coins, [], [], "flip for", "your");
    if (!myWalletVerification.success) {
        interaction.editOriginalMessage(myWalletVerification.failureMessage);
        return;
    }
    const openFlip = !otherUserId;
    if (!openFlip) {
        const otherWalletVerification = verifyWallet(await db.getWallet(otherUserId), coins, [], [], "flip for", "the other user's");
        if (!otherWalletVerification.success) {
            interaction.editOriginalMessage(otherWalletVerification.failureMessage);
            return;
        }
    }
    const msg = {
        embeds: [
            {
                description: `${openFlip ? "Does anyone" : `<@${otherUserId}>, do you`} want to coin flip with <@${userId}> for **${formatNum(coins)} coins**? They chose **${heads ? "heads" : "tails"}**.`,
                color: 16114498,
                author: {
                    name: "Coin flip",
                    icon_url: "https://i.imgur.com/7W4WJI6.png"
                },
                footer: {
                    text: "You have 30 seconds to respond."
                }
            }
        ],
        components: [
            {
                type: Constants.ComponentTypes.ACTION_ROW,
                components: openFlip ? [
                    {
                        custom_id: "flip-confirm",
                        type: Constants.ComponentTypes.BUTTON,
                        style: Constants.ButtonStyles.SUCCESS,
                        label: "Confirm"
                    }
                ] : [
                    {
                        custom_id: "flip-confirm",
                        type: Constants.ComponentTypes.BUTTON,
                        style: Constants.ButtonStyles.SUCCESS,
                        label: "Confirm"
                    },
                    {
                        custom_id: "flip-decline",
                        type: Constants.ComponentTypes.BUTTON,
                        style: Constants.ButtonStyles.DANGER,
                        label: "Decline"
                    }
                ]
            }
        ]
    };
    interaction.createMessage(msg);
    const messageId = (await interaction.getOriginalMessage()).id;
    bot.setPermittedReact(messageId, otherUserId ?? true);
    const result = await Promise.race([
        once(bot, "flipreact" + messageId),
        sleep(30000)
    ]);
    bot.removeAllListeners("flipreact" + messageId);
    msg.components = [];
    if (!result) {
        msg.embeds[0].footer = {
            text: "This coin flip request has expired."
        };
        interaction.editOriginalMessage(msg);
        return;
    }
    const [reactInteraction, reaction] = result;
    reactInteraction.acknowledge();
    otherUserId = reactInteraction.member.id;
    if (!reaction) {
        msg.embeds[0].footer = {
            text: "This coin flip request has been declined."
        };
        interaction.editOriginalMessage(msg);
        return;
    }
    interaction.editOriginalMessage(msg);
    // flip request accepted
    const stResult = db.startTransaction(userId);
    if (!stResult.success) {
        interaction.createFollowup(stResult.globalError ? `You cannot flip because ${stResult.error}.` : `You cannot flip because <@${userId}> has an ongoing transaction.`);
        return;
    }
    const stResult2 = db.startTransaction(otherUserId);
    if (!stResult2.success) {
        interaction.createFollowup(stResult2.globalError ? `You cannot flip because ${stResult2.error}.` : `You cannot flip because <@${otherUserId}> has an ongoing transaction.`);
        db.endTransaction(userId);
        return;
    }
    try {
        const myWalletVerification2 = verifyWallet(await db.getWallet(userId), coins, [], [], "flip for", `<@${userId}>'s`);
        if (!myWalletVerification2.success) {
            interaction.createFollowup(myWalletVerification2.failureMessage);
            return;
        }
        const otherWalletVerification2 = verifyWallet(await db.getWallet(otherUserId), coins, [], [], "flip for", `<@${otherUserId}>'s`);
        if (!otherWalletVerification2.success) {
            interaction.createFollowup(otherWalletVerification2.failureMessage);
            return;
        }
        const username = await db.getMadfutUserByDiscordUser(userId);
        if (!username) {
            interaction.createFollowup(`Coin flip failed as there is no MADFUT username linked to <@${userId}>'s Discord account. To link one, use \`/madfut link <username>\`.`);
            return;
        }
        const otherUsername = await db.getMadfutUserByDiscordUser(otherUserId);
        if (!otherUsername) {
            interaction.createFollowup(`Coin flip failed as there is no MADFUT username linked to <@${otherUserId}>'s Discord account. To link one, use \`/madfut link <username>\`.`);
            return;
        }
        const transactions = [];
        transactions.push(db.addCoins(userId, iWin ? coins : -coins));
        transactions.push(db.addCoins(otherUserId, iWin ? -coins : coins));
        await Promise.all(transactions);
    } finally{
        db.endTransaction(userId);
        db.endTransaction(otherUserId);
    }
    interaction.createFollowup({
        embeds: [
            {
                color: 16114498,
                author: {
                    name: "Coin flip",
                    icon_url: "https://i.imgur.com/7W4WJI6.png"
                },
                description: `**${flipResult ? "Heads" : "Tails"}**! <@${iWin ? userId : otherUserId}> won the coin flip against <@${iWin ? otherUserId : userId}> for **${formatNum(coins)} coins**.`
            }
        ]
    });
});
const allowedPacks = [
    "silver_special",
    "bf_nine_special",
    "bf_five_special",
    "totw",
    "fatal_rare",
    "bf_93_special",
    "fatal_special",
    "double_special",
    "triple_special",
    "gold",
    "random",
    "gold_super",
    "rare",
    "bf_94_special",
    "bf_eight_special",
    "free",
    "silver_plus",
    "no_totw_special",
    "fatal_silver",
    "85_special",
    "bf_89_special",
    "bf_88_special",
    "bf_four_special",
    "bf_seven_special",
    "gold_mega",
    "special",
    "rainbow",
    "bf_six_special",
    "bf_92_special",
    "80+",
    "bf_86_special",
    "fatal_nonrare",
    "bf_91_special",
    "bf_87_special",
    "silver",
    "op_special",
    "bf_90_special",
    "fatal_bronze",
    "pp_sbc_real_madrid_icons",
    "pp_new_87_91",
    "pp_fut_champs",
    "pp_new_81_84",
    "pp_special",
    "pp_special_88_92",
    "pp_best_1",
    "pp_new_83_86",
    "pp_new_77_82",
    "pp_new_85_88",
    "pp_bad_1",
    "pp_totw",
    "pp_new_special",
    "pp_icons_86_92",
    "pp_mega",
    "pp_good_1",
    "pp_icon",
    "pp_special_83_86",
    "pp_special_81_84",
    "pp_special_85_88",
    "pp_special_86_89"
];
bot.on("invme", async (interaction, coins, myPacks)=>{
    const userId = interaction.member.id;
    if (myPacks) {
        if (myPacks.length > 3) {
            interaction.createMessage({
                embeds: [
                    {
                        color: 15417396,
                        description: `❌ You can't pick more than 3 packs.`
                    }
                ],
                flags: Constants.MessageFlags.EPHEMERAL
            });
            return;
        }
        for (const pack of myPacks){
            if (!allowedPacks.includes(pack)) {
                interaction.createMessage({
                    embeds: [
                        {
                            color: 15417396,
                            description: `❌ Invalid pack \`${pack}\`.`
                        }
                    ],
                    flags: Constants.MessageFlags.EPHEMERAL
                });
                return;
            }
        }
    }
    coins = Math.max(Math.min(coins, 10000000), 0);
    const username = await db.getMadfutUserByDiscordUser(userId);
    if (!username) {
        interaction.createMessage({
            embeds: [
                {
                    color: 15417396,
                    description: "❌ You have no MADFUT account linked."
                }
            ],
            flags: Constants.MessageFlags.EPHEMERAL
        });
        return;
    }
    interaction.createMessage({
        embeds: [
            {
                color: 3319890,
                description: "✅ Command successful."
            }
        ],
        flags: Constants.MessageFlags.EPHEMERAL
    });
    freeTradeUnlimited(username, coins, myPacks ? myPacks.map((pack)=>({
            pack,
            amount: 1
        })
    ) : packs1);
});
bot.on("setpacks", async (interaction, thepacks)=>{
    packs1 = thepacks.map((packname)=>({
            pack: packname,
            amount: 1
        })
    );
    interaction.createMessage({
        embeds: [
            {
                color: 3319890,
                description: "✅ Command successful."
            }
        ],
        flags: Constants.MessageFlags.EPHEMERAL
    });
});
bot.on("freetrade", async (interaction, amount, username, userId)=>{
    console.log(amount, username, userId);
    if (!username && !userId) {
        interaction.createMessage({
            embeds: [
                {
                    color: 15417396,
                    description: "❌ Enter either a username or a discord user."
                }
            ],
            flags: Constants.MessageFlags.EPHEMERAL
        });
        return;
    } else if (userId) {
        username = await db.getMadfutUserByDiscordUser(userId);
        if (!username) {
            interaction.createMessage({
                embeds: [
                    {
                        color: 15417396,
                        description: "❌ User does not have their MADFUT account linked."
                    }
                ],
                flags: Constants.MessageFlags.EPHEMERAL
            });
            return;
        }
    }
    username = username;
    freeTrade(username, amount);
    interaction.createMessage({
        embeds: [
            {
                color: 3319890,
                description: "✅ Command successful."
            }
        ],
        flags: Constants.MessageFlags.EPHEMERAL
    });
});
bot.on("end-transaction", (interaction, userId)=>{
    db.endTransaction(userId);
    interaction.createMessage({
        embeds: [
            {
                color: 3319890,
                description: "✅ Successfully force-ended all transactions for this user."
            }
        ],
        flags: Constants.MessageFlags.EPHEMERAL
    });
});
let giveawayRunning = false;
let giveawayStartTimeout;
let giveawayEndTimeout;
let giveawayDuration;
let rawGiveawayDuration;
let giveawayMessage;
bot.on("ga-forcestop", async (interaction)=>{
    giveawayEnd(interaction.channel.id);
    interaction.createMessage({
        content: "Force stop successful",
        flags: Constants.MessageFlags.EPHEMERAL
    });
    return;
});
bot.on("ga-announce", async (interaction, start, duration)=>{
    if (isNaN(parseFloat(start))) {
        interaction.createMessage({
            content: "Enter a valid number of minutes for the start",
            flags: Constants.MessageFlags.EPHEMERAL
        });
        return;
    }
    if (duration && isNaN(parseFloat(start))) {
        interaction.createMessage({
            content: "Enter a valid number of minutes for the duration",
            flags: Constants.MessageFlags.EPHEMERAL
        });
        return;
    }
    const durationMinutes = duration ? parseFloat(duration) : undefined;
    rawGiveawayDuration = duration;
    giveawayDuration = durationMinutes ? durationMinutes * 60000 : undefined;
    const minutes = parseFloat(start);
    const startTime = Math.round(Date.now() / 1000 + minutes * 60);
    await interaction.createMessage({
        content: "Command successful",
        flags: Constants.MessageFlags.EPHEMERAL
    });
    const channelId = interaction.channel.id;
    giveawayMessage = await bot.sendMessage(channelId, {
        allowedMentions: {
            roles: [
                bot.config.giveawayPingRoleId
            ]
        },
        content: `<@&${bot.config.giveawayPingRoleId}>, a ${duration ? duration + " minute long " : ""}giveaway from MadFut is starting <t:${startTime}:R>!`
    });
    await bot.react(giveawayMessage, "🎉");
    giveawayStartTimeout = setTimeout(()=>{
        giveawayStart();
    }, minutes * 60000);
    return;
});
bot.on("ga-forcestart", async (interaction)=>{
    giveawayStart();
    interaction.createMessage({
        content: "Force start successful",
        flags: Constants.MessageFlags.EPHEMERAL
    });
    return;
});
async function giveawayTrade(username) {
    while(giveawayRunning){
        let tradeRef;
        try {
            tradeRef = await madfutClient.inviteWithTimeout(username, 60000, "MadFut");
        } catch  {
            console.log(`${username} rejected invite or timed out.`);
            continue;
        }
        try {
            await madfutClient.doTrade(tradeRef, async (profile)=>({
                    receiveCoins: false,
                    receiveCards: false,
                    receivePacks: false,
                    giveCards: profile[ProfileProperty.wishList]?.slice(0, 3) ?? [],
                    giveCoins: 10000000,
                    givePacks: packs1
                })
            );
            console.log(`Completed giveaway trade with ${username}`);
        } catch (_err) {
            console.log(`Giveaway trade with ${username} failed: Player left`);
        }
    }
}
async function giveawayStart() {
    if (giveawayStartTimeout) clearTimeout(giveawayStartTimeout);
    if (giveawayMessage) {
        await bot.editMessage(giveawayMessage.channel.id, giveawayMessage.id, {
            content: `Signups for this giveaway are now closed. The giveaway will be starting shortly.`,
            components: []
        });
    }
    bot.removeAllListeners("giveawayjoin");
    giveawayRunning = true;
    const giveawaySignups = await db.getMadfutUsersByDiscordUsers(await bot.getReacts(giveawayMessage, "🎉"));
    for (const username of giveawaySignups){
        console.log("signupper", username);
        giveawayTrade(username);
    }
    await bot.sendMessage(giveawayMessage.channel.id, {
        allowedMentions: {
            roles: [
                bot.config.giveawayPingRoleId
            ]
        },
        content: `<@&${bot.config.giveawayPingRoleId}>, the ${rawGiveawayDuration ? rawGiveawayDuration + " minute long " : ""}giveaway has started with **${giveawaySignups.length} people**! Look at your invites and trade as many times as you can!`
    });
    if (giveawayDuration) {
        giveawayEndTimeout = setTimeout(()=>{
            giveawayEnd(giveawayMessage.channel.id);
        }, giveawayDuration);
    }
}
async function giveawayEnd(channelId) {
    giveawayRunning = false;
    if (giveawayEndTimeout) clearTimeout(giveawayEndTimeout);
    bot.sendMessage(channelId, {
        allowedMentions: {
            roles: [
                bot.config.giveawayPingRoleId
            ]
        },
        content: `<@&${bot.config.giveawayPingRoleId}>, the giveaway has ended!`
    });
}
bot.on("lock", (interaction, reason)=>{
    db.lockTransactions(reason);
    interaction.createMessage({
        embeds: [
            {
                color: 3319890,
                description: "✅ Successfully locked all transactions."
            }
        ],
        flags: Constants.MessageFlags.EPHEMERAL
    });
});
bot.on("unlock", (interaction)=>{
    db.unlockTransactions();
    interaction.createMessage({
        embeds: [
            {
                color: 3319890,
                description: "✅ Successfully unlocked all transactions."
            }
        ],
        flags: Constants.MessageFlags.EPHEMERAL
    });
});
bot.on("rawquery", async (interaction, query)=>{
    await db.runPromise(query);
    interaction.createMessage({
        embeds: [
            {
                color: 3319890,
                description: "✅ Successfully ran query."
            }
        ],
        flags: Constants.MessageFlags.EPHEMERAL
    });
});
console.log("Bot event listeners registered");
console.log("MADFUT BOT Is Working Now");
console.log("Started");
