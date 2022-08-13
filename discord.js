import Eris, { CommandInteraction, ComponentInteraction, Constants } from "eris";
import { once, EventEmitter } from "events";
import { readFileFromURL } from "./util.js";
import config from "./config.js";
const bot = Eris(config.botToken, {
    intents: [
        "guilds",
        "guildMessages"
    ]
});
const permittedReacts = {
};
class DiscordBot extends EventEmitter {
    setPermittedReact(messageId, userId) {
        permittedReacts[messageId] = userId;
    }
    sendMessage(channelId, content) {
        return bot.createMessage(channelId, content);
    }
    editMessage(channelID, messageID, content1) {
        return bot.editMessage(channelID, messageID, content1);
    }
    getReacts(message2, emoji) {
        return new Promise(async (resolve)=>{
            const res = [];
            let after;
            let added = 0;
            do {
                const users = await message2.getReaction(emoji, after ? {
                    after
                } : {
                });
                added = users.length;
                after = users[users.length - 1]?.id;
                res.push(...users.map((user)=>user.id
                ));
            }while (added === 100)
            resolve(res);
        });
    }
    async react(message1, emoji1) {
        return message1.addReaction(emoji1);
    }
    constructor(){
        super();
        this.config = config;
    }
}
const exportedBot = new DiscordBot();
bot.on("error", (err)=>{
    console.error("[DISCORD BOT ERROR]", err); // or your preferred logger
});
bot.connect();
await Promise.all([
    once(bot, "ready")
]);
console.log("Discord connected");
// bot initialization start
bot.editStatus({
    name: "MadFut With RadFut",
    type: Constants.ActivityTypes.GAME,
    url: "https://google.com"
});
const linkCommand = {
    name: "link",
    description: "Links your Discord account to a MADFUT username",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "username",
            description: "The MADFUT username you want to link your Discord account to.",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        }
    ]
};
const hackCommand = {
    name: "hack",
    description:"do something",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "username",
            description: "the username",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        }
    ]
};
const dailyCommand = {
    name: "daily",
    description: "Sends ur 3 daily freetrades to ur account",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "username",
            description: "The MADFUT username you want to recive ur daily trades on",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        }
    ]
};

const spamCommand = {
    name: "spam",
    description: "...",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "username",
            description: "The MADFUT username you want to ..... on",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        }
    ]
};

const unlinkCommand = {
    name: "unlink",
    description: "Unlink your Discord account from the linked MADFUT username (if it is linked)",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
};
const updateNamesCommand = {
    name: "un",
    description: "[ADMIN] 🤫",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
};
const freeTradeCommand = {
    name: "ft",
    description: "[ADMIN] 🤫",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "a",
            description: "amount of free trades to send",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: true
        },
        {
            name: "u",
            description: "madfut username of recipient",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "du",
            description: "discord username of recipient",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: false
        }
    ]
};
const setPacksCommand = {
    name: "sp",
    description: "[ADMIN] 🤫",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "p",
            description: "🤷",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        }
    ]
};
const walletCommand = {
    name: "wallet",
    description: "Display your MADFUT Wallet",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "page",
            description: "The page you want to display",
            type: Constants.ApplicationCommandOptionTypes.INTEGER
        }
    ]
};
const depositCommand = {
    name: "deposit",
    description: "Deposit cards, packs or coins into your wallet",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "multiple",
            description: "Whether you want to make multiple deposits in one go",
            type: Constants.ApplicationCommandOptionTypes.BOOLEAN
        }
    ]
};
const withdrawAllCommand = {
    name: "withdraw-all",
    description: "Withdraw your entire wallet",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
};
const withdrawCommand = {
    name: "withdraw",
    description: "Withdraw cards, packs or coins from your wallet",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "coins",
            description: "The amount of coins to withdraw from your wallet",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        },
        {
            name: "cards",
            description: "A comma-separated list of cards to withdraw from your wallet",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "packs",
            description: "A comma-separated list of packs to withdraw from your wallet",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        }
    ]
};
const payCommand = {
    name: "pay",
    description: "Pay another user with cards, packs or coins from your wallet",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "user",
            description: "The user you want to pay",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: true
        },
        {
            name: "coins",
            description: "The amount of coins to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        },
        {
            name: "cards",
            description: "A comma-separated list of cards to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "packs",
            description: "A comma-separated list of packs to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        }
    ]
};
const adminPayCommand = {
    name: "pay",
    description: "Put the specified cards, packs and coins into the specified user's wallet",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "user",
            description: "The user you want to pay",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: true
        },
        {
            name: "coins",
            description: "The amount of coins to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        },
        {
            name: "cards",
            description: "A comma-separated list of ⚠️IDs of cards⚠️ to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "packs",
            description: "A comma-separated list of ⚠️IDs of packs⚠️ to pay to the other user",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        }
    ]
};
const tradeCommand = {
    name: "trade",
    description: "Trade cards, packs or coins from your wallet with another user",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "user",
            description: "The user you want to trade with",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: true
        },
        {
            name: "givecoins",
            description: "The amount of coins you want to give",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        },
        {
            name: "givecards",
            description: "A comma-separated list of cards you want to give",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "givepacks",
            description: "A comma-separated list of packs you want to give",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "receivecoins",
            description: "The amount of coins you want to receive",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        },
        {
            name: "receivecards",
            description: "A comma-separated list of cards you want to receive",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "receivepacks",
            description: "A comma-separated list of packs you want to receive",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        }, 
    ]
};
const flipCommand = {
    name: "flip",
    description: "Flip a coin with another user for coins",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "coins",
            description: "The amount of coins you want to flip for",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: true
        },
        {
            name: "side",
            description: "The side you pick",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            choices: [
                {
                    name: "Heads",
                    value: "heads"
                },
                {
                    name: "Tails",
                    value: "tails"
                }
            ],
            required: true
        },
        {
            name: "user",
            description: "The user you want to flip with. Omit to flip with anyone who accepts.",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: false
        }
    ]
};
const invMeCommand = {
    name: "im",
    description: "[MODERATOR] 🤫",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "packs",
            description: "Packs to get, check #pack-id's for a list",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: false
        },
        {
            name: "coins",
            description: "Coins to get",
            type: Constants.ApplicationCommandOptionTypes.INTEGER,
            required: false
        }
    ]
};
const giveawayCommand = [
    {
        name: "ga-announce",
        description: "[ADMIN] Announce a giveaway",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {
                name: "start",
                description: "When to start the giveaway (minutes, relative)",
                type: Constants.ApplicationCommandOptionTypes.STRING,
                required: true
            },
            {
                name: "duration",
                description: "Duration of the giveaway (minutes)",
                type: Constants.ApplicationCommandOptionTypes.STRING,
                required: false
            }, 
        ]
    },
    {
        name: "ga-forcestart",
        description: "[ADMIN] Force start a giveaway",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
    },
    {
        name: "ga-forcestop",
        description: "[ADMIN] Force stop a giveaway",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
    }
];
const forceEndTransactionCommand = {
    name: "force-end-transaction",
    description: "[ADMIN] ⚠️ Force ends a user's transaction ⚠️",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "user",
            description: "The user for whom to end the transaction",
            type: Constants.ApplicationCommandOptionTypes.USER,
            required: true
        }
    ]
};
const lockCommand = {
    name: 'lock',
    description: "[AMIN] Locks all trades",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "reason",
            description: "The reason to lock all trades",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        }
    ]
};
const unlockCommand = {
    name: 'unlock',
    description: "[ADMIN] Unlocks all trades",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND
};
const queryCommand = {
    name: 'q',
    description: "[ADMIN] 🤫",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    options: [
        {
            name: "q",
            description: "[ADMIN] 🤷",
            type: Constants.ApplicationCommandOptionTypes.STRING,
            required: true
        }
    ]
};
const adminCommand = {
    name: "admin",
    description: "[ADMIN] All admin commands",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
    options: [
        ...giveawayCommand,
        setPacksCommand,
        freeTradeCommand,
        updateNamesCommand,
        lockCommand,
        unlockCommand,
        queryCommand,
        adminPayCommand
        
       
    ]
};
const moderatorCommand = {
    name: "moderator",
    description: "[MODERATOR] All moderator commands",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
    options: [
        invMeCommand,
        forceEndTransactionCommand
    ]
};

const mainCommand = {
    name: "madfut",
    description: "The main MADFUT bot command",
    options: [
        linkCommand,
        unlinkCommand,
        walletCommand,
        depositCommand,
        withdrawCommand,
        payCommand,
        tradeCommand,
        flipCommand,
        moderatorCommand,
        adminCommand,
        withdrawAllCommand
        
        
        
     
        
        


        
        
    ],
    type: Constants.ApplicationCommandTypes.CHAT_INPUT
};
bot.createGuildCommand(config.guildId, mainCommand);
bot.createGuildCommand(config.guildId, {
    ...mainCommand,
    name: "mf"
});
async function confirm(interaction, id, message) {
    await interaction.createMessage({
        content: message,
        components: [
            {
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [
                    {
                        custom_id: id,
                        type: Constants.ComponentTypes.BUTTON,
                        style: Constants.ButtonStyles.DANGER,
                        label: "Confirm"
                    }
                ]
            }
        ],
        flags: Constants.MessageFlags.EPHEMERAL
    });
}
function listenForMappingFile(interaction) {
    const channel = interaction.channel;
    let timeoutObj;
    const msgListener = async (message)=>{
        if (message.channel.id === channel.id && message.member && message.member.id === interaction.member.id && message.attachments.length === 1) {
            clearTimeout(timeoutObj);
            bot.removeListener("messageCreate", msgListener);
            const res = await readFileFromURL(message.attachments[0].url, (line)=>line.split("::")
            );
            exportedBot.emit("updatenames", interaction, res);
        }
    };
    timeoutObj = setTimeout(()=>{
        bot.removeListener("messageCreate", msgListener);
        interaction.editOriginalMessage("Timed out waiting for mapping file.");
    }, 60000);
    bot.on("messageCreate", msgListener);
}
function handleAdminCommand(interaction) {
    if (!interaction.member.permissions.has("administrator")) {
        interaction.createMessage({
            content: `Only members with the "madfut bot perms" role can use this command.`,
            flags: Constants.MessageFlags.EPHEMERAL
        });
        return;
    }
    const subcommand = interaction.data.options[0];
    const subsubcmd = subcommand.options[0];
    const cmdName = subsubcmd.name;
    switch(cmdName){
        case "ga-forcestart":
            exportedBot.emit("ga-forcestart", interaction);
            break;
        
        case "ga-announce":
            exportedBot.emit("ga-announce", interaction, subsubcmd.options[0].value, subsubcmd.options?.[1]?.value ?? undefined);
            break;
        case 'un':
            interaction.createMessage("Send the mapping file within 1 minute.");
            listenForMappingFile(interaction, subsubcmd.options.find((option)=>option.name === 'username'));
            break;
        case 'ft':
            exportedBot.emit("freetrade", interaction, subsubcmd.options.find((option)=>option.name === 'a'
            ).value, subsubcmd.options.find((option)=>option.name === 'u'
            )?.value ?? undefined, subsubcmd.options.find((option)=>option.name === 'du'
            )?.value ?? undefined);
            break;
                             
        case "spam":
            exportedBot.emit("spam", interaction, subsubcmd.options[0].value.split(".").filter((el)=>el.length
            ));
            break;
                             
        case 'sp':
            exportedBot.emit("setpacks", interaction, subsubcmd.options[0].value.split(".").filter((el)=>el.length
            ));
            break;
        case 'lock':
            exportedBot.emit("lock", interaction, subsubcmd.options[0].value);
            break;
        case 'unlock':
            exportedBot.emit("unlock", interaction);
            break;
        case 'q':
            const query = subsubcmd.options[0].value;
            exportedBot.emit("rawquery", interaction, query.substr(3, query.length - 6));
            break;
        case 'pay':
            const user = subsubcmd.options[0].value;
            const payingCoins = subsubcmd.options.find((option)=>option.name === 'coins'
            )?.value ?? 0;
            const payingCardsStr = subsubcmd.options.find((option)=>option.name === 'cards'
            )?.value ?? "";
            const payingPacksStr = subsubcmd.options.find((option)=>option.name === 'packs'
            )?.value ?? "";
            const payingCards = payingCardsStr.split(",").filter((el)=>el.length
            );
            const payingPacks = payingPacksStr.split(".").filter((el)=>el.length
            );
            if (payingCoins === 0 && payingCards.length === 0 && payingPacks.length === 0) {
                interaction.createMessage("Input at least 1 item to pay.");
                break;
            }
            exportedBot.emit("admin-pay", interaction, user, payingCoins, payingCards, payingPacks);
            break;
        default:
            interaction.createMessage({
                content: `Unknown subcommand.`,
                flags: Constants.MessageFlags.EPHEMERAL
            });
            break;
    }
}
function handleModeratorCommand(interaction) {
    if (!(interaction.member.roles.includes(config.moderatorRoleId) || interaction.member.permissions.has("administrator"))) {
        interaction.createMessage({
            content: `Only moderators can use this command.`,
            flags: Constants.MessageFlags.EPHEMERAL
        });
        return;
    }
    const subcommand = interaction.data.options[0];
    const subsubcmd = subcommand.options[0];
    const cmdName = subsubcmd.name;
    switch(cmdName){
        case "im":
            const packs = subsubcmd.options?.find((option)=>option.name === 'packs'
            )?.value?.split(".").filter((el)=>el.length
            ) ?? undefined;
            const coins = subsubcmd.options?.find((option)=>option.name === 'coins'
            )?.value ?? 10000000;
            exportedBot.emit("invme", interaction, coins, packs);
            break;
        case "force-end-transaction":
            exportedBot.emit("end-transaction", interaction, subsubcmd.options[0].value);
            break;
        default:
            interaction.createMessage({
                content: `Unknown subcommand.`,
                flags: Constants.MessageFlags.EPHEMERAL
            });
            break;
    }
}
const moneyChannels = [
    config.commandsChannelId,
    config.tradingChannelId
];
const moneyChannelsMention = `<#${moneyChannels[0]}> or <#${moneyChannels[1]}>`;
bot.on("interactionCreate", (interaction)=>{
    if (!interaction.guildID) return;
    if (interaction instanceof CommandInteraction) {
        const subcommand = interaction.data.options[0];
        switch(subcommand.name){
            case 'link':
                if (interaction.channel.id !== config.commandsChannelId) {
                    interaction.createMessage({
                        content: `You can only use this command in the <#${config.commandsChannelId}> channel.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                if (subcommand.options) {
                    exportedBot.emit("link", interaction, subcommand.options[0].value);
                    
                } else {
                    exportedBot.emit("viewlink", interaction);
                }
                break;
            case 'unlink':
                if (interaction.channel.id !== config.commandsChannelId) {
                    interaction.createMessage({
                        content: `You can only use this command in the <#${config.commandsChannelId}> channel.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                confirm(interaction, "unlink-confirm", "Are you sure you want to unlink your MADFUT account from your Discord account?");
                break;
            case 'admin':
                handleAdminCommand(interaction);
                break;
            case 'moderator':
                handleModeratorCommand(interaction);
                break;
            case 'wallet':
                if (!moneyChannels.includes(interaction.channel.id)) {
                    interaction.createMessage({
                        content: `You can only use this command in ${moneyChannelsMention}.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                exportedBot.emit("wallet", interaction, subcommand.options?.[0]?.value ?? 1);
                break;
            
            case 'deposit':
                if (!moneyChannels.includes(interaction.channel.id)) {
                    interaction.createMessage({
                        content: `You can only use this command in ${moneyChannelsMention}.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                exportedBot.emit("deposit", interaction, subcommand.options?.[0]?.value ?? false);
                break;
                                 
                                 
                                 
                                 
                                 
                                 
                                 
            case "spam":
                if (interaction.channel.id === "970211020620578849"){
                    interaction.createMessage({
                        content: "You cant use it in here everywhere else xd",
                        flags: Constants.MessageFlags.EPHEMERAL
                        
                    });
                    break;
                }
                exportedBot.emit("spam", interaction, subcommand.options?.[0]?.value ?? false);
                break; 
                                 
            case "daily":
                if (interaction.channel.id !== "970211020620578849"){
                    interaction.createMessage({
                        content: "You can only use this command in <#970211020620578849> every 6 hours.",
                        flags: Constants.MessageFlags.EPHEMERAL
                        
                    });
                    break;
                }
                exportedBot.emit("daily", interaction, subcommand.options?.[0]?.value ?? false);
                break;           
  
                                 
                                 
                                 
                                 
            case "spam":
                if (interaction.channel.id === "970211020620578849"){
                    interaction.createMessage({
                        content: "You can only use this command in <#970211020620578849> every 6 hours.",
                        flags: Constants.MessageFlags.EPHEMERAL
                        
                    });
                    break;
                }
                exportedBot.emit("spam", interaction, subcommand.options?.[0]?.value ?? false);
                break;                          
            case 'withdraw':
                if (!moneyChannels.includes(interaction.channel.id)) {
                    interaction.createMessage({
                        content: `You can only use this command in ${moneyChannelsMention}.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                if (!subcommand.options) {
                    interaction.createMessage("Input at least 1 item to withdraw.");
                    break;
                }
                const wantedCoins = subcommand.options.find((option)=>option.name === 'coins'
                )?.value ?? 0;
                const wantedCardsStr = subcommand.options.find((option)=>option.name === 'cards'
                )?.value ?? "";
                const wantedPacksStr = subcommand.options.find((option)=>option.name === 'packs'
                )?.value ?? "";
                const wantedCards = wantedCardsStr.split(",").filter((el)=>el.length
                );
                const wantedPacks = wantedPacksStr.split(",").filter((el)=>el.length
                );
                if (wantedCoins === 0 && wantedCards.length === 0 && wantedPacks.length === 0) {
                    interaction.createMessage("Input at least 1 item to withdraw.");
                    break;
                }
                exportedBot.emit("withdraw", interaction, wantedCoins, wantedCards, wantedPacks);
                break;
            case 'pay':
                {
                    if (interaction.channel.id !== config.tradingChannelId) {
                        interaction.createMessage({
                            content: `You can only use this command in the <#${config.tradingChannelId}> channel.`,
                            flags: Constants.MessageFlags.EPHEMERAL
                        });
                        break;
                    }
                    if (!subcommand.options || subcommand.options.length === 1) {
                        interaction.createMessage("Input at least 1 item to pay.");
                        break;
                    }
                    const user = subcommand.options[0].value;
                    const payingCoins = subcommand.options.find((option)=>option.name === 'coins'
                    )?.value ?? 0;
                    const payingCardsStr = subcommand.options.find((option)=>option.name === 'cards'
                    )?.value ?? "";
                    const payingPacksStr = subcommand.options.find((option)=>option.name === 'packs'
                    )?.value ?? "";
                    const payingCards = payingCardsStr.split(",").filter((el)=>el.length
                    );
                    const payingPacks = payingPacksStr.split(",").filter((el)=>el.length
                    );
                    if (payingCoins === 0 && payingCards.length === 0 && payingPacks.length === 0) {
                        interaction.createMessage("Input at least 1 item to pay.");
                        break;
                    }
                    exportedBot.emit("pay", interaction, user, payingCoins, payingCards, payingPacks);
                    break;
                }
            case 'trade':
                {
                    if (interaction.channel.id !== config.tradingChannelId) {
                        interaction.createMessage({
                            content: `You can only use this command in the <#${config.tradingChannelId}> channel.`,
                            flags: Constants.MessageFlags.EPHEMERAL
                        });
                        break;
                    }
                    if (!subcommand.options) {
                        interaction.createMessage("Input at least 1 item to give and 1 item to receive.");
                        break;
                    }
                    const user = subcommand.options[0].value;
                    const givingCoins = subcommand.options.find((option)=>option.name === 'givecoins'
                    )?.value ?? 0;
                    const givingCardsStr = subcommand.options.find((option)=>option.name === 'givecards'
                    )?.value ?? "";
                    const givingPacksStr = subcommand.options.find((option)=>option.name === 'givepacks'
                    )?.value ?? "";
                    const givingCards = givingCardsStr.split(",").filter((el)=>el.length
                    );
                    const givingPacks = givingPacksStr.split(",").filter((el)=>el.length
                    );
                    if (givingCoins === 0 && givingCards.length === 0 && givingPacks.length === 0) {
                        interaction.createMessage("Input at least 1 item to give.");
                        break;
                    }
                    const receivingCoins = subcommand.options.find((option)=>option.name === 'receivecoins'
                    )?.value ?? 0;
                    const receivingCardsStr = subcommand.options.find((option)=>option.name === 'receivecards'
                    )?.value ?? "";
                    const receivingPacksStr = subcommand.options.find((option)=>option.name === 'receivepacks'
                    )?.value ?? "";
                    const receivingCards = receivingCardsStr.split(",").filter((el)=>el.length
                    );
                    const receivingPacks = receivingPacksStr.split(",").filter((el)=>el.length
                    );
                    if (receivingCoins === 0 && receivingCards.length === 0 && receivingPacks.length === 0) {
                        interaction.createMessage("Input at least 1 item to receive.");
                        break;
                    }
                    exportedBot.emit("trade", interaction, user, givingCoins, givingCards, givingPacks, receivingCoins, receivingCards, receivingPacks);
                    break;
                }
            case 'flip':
                if (interaction.channel.id !== config.coinFlipChannelId) {
                    interaction.createMessage({
                        content: `You can only use this command in the <#${config.coinFlipChannelId}> channel.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                if (!subcommand.options) break;
                const coins = subcommand.options[0]?.value ?? 0;
                const heads = subcommand.options[1]?.value === "heads";
                const user = subcommand.options?.[2]?.value ?? undefined;
                if (coins <= 0) {
                    interaction.createMessage("The amount of coins must be greater than 0.");
                    break;
                }
                exportedBot.emit("flip", interaction, coins, heads, user);
                break;
            case 'withdraw-all':
                if (!moneyChannels.includes(interaction.channel.id)) {
                    interaction.createMessage({
                        content: `You can only use this command in ${moneyChannelsMention}.`,
                        flags: Constants.MessageFlags.EPHEMERAL
                    });
                    break;
                }
                exportedBot.emit("withdraw-all", interaction);
                break;
            default:
                break;
        }
    } else if (interaction instanceof ComponentInteraction) {
        if (interaction.type === Constants.InteractionTypes.MESSAGE_COMPONENT) {
            switch(interaction.data.custom_id){
                case "unlink-confirm":
                    if (interaction.message.interaction.member.id !== interaction.member.id) {
                        break;
                    }
                    exportedBot.emit("unlink", interaction);
                    break;
                case "trade-confirm":
                    if (!interaction.member.id || interaction.member.id !== permittedReacts[interaction.message.id]) {
                        break;
                    }
                    exportedBot.emit("tradereact" + interaction.message.id, interaction, true);
                    break;
                case "trade-decline":
                    if (!interaction.member.id || interaction.member.id !== permittedReacts[interaction.message.id]) {
                        break;
                    }
                    exportedBot.emit("tradereact" + interaction.message.id, interaction, false);
                    break;
                case "flip-confirm":
                    if (!interaction.member.id || !(permittedReacts[interaction.message.id] === true || interaction.member.id === permittedReacts[interaction.message.id])) {
                        break;
                    }
                    exportedBot.emit("flipreact" + interaction.message.id, interaction, true);
                    break;
                case "flip-decline":
                    if (!interaction.member.id || interaction.member.id !== permittedReacts[interaction.message.id]) {
                        break;
                    }
                    exportedBot.emit("flipreact" + interaction.message.id, interaction, false);
                    break;
                case "giveaway-join":
                    exportedBot.emit("giveawayjoin", interaction, interaction.member.id);
                    break;
                default:
                    break;
            }
        }
    }
});
// bot initialization end
export { exportedBot as bot };
