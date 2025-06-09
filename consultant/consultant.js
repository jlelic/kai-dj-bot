import { gptClient } from '../gpt-client.js'

export const answerQuestion = async (question, name) => {
    return await gptClient.generate(`Poslucháč ${name} má pre teba otázku. Zopakuj otázku a odpovedz ako keby si bol odborník na tému. Otázka znie:\n\n${question}`, 600 + question.length)
}