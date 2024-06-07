import {SlashCommandBuilder} from 'discord.js'

export default {
    data: new SlashCommandBuilder()
        .setName('otazka')
        .setDescription('Opýtaj sa DJa otázku!')
        .addStringOption(option =>
            option.setName('znenie-otazky')
                .setDescription('Čo sa chceš opýtať DJa?')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.reply('Hmmmm')
    },
}
