import { SlashCommandBuilder } from 'discord.js'

export default {
    data: new SlashCommandBuilder()
        .setName('hraj')
        .setDescription('Zahra hudbu!')
        .addStringOption(option =>
            option.setName('názov-pesničky')
                .setDescription('Čo má DJ zahrať')
                .setRequired(true)),
    async execute(interaction) {
        console.log('aaaaaaaa')
        await interaction.reply('Šak počkaj')
    },
}
