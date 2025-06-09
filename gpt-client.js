import fetch from 'node-fetch'

const API_URL = 'https://api.openai.com/v1/chat/completions'

export default class GptClient {
    token

    constructor(token) {
        this.token = token
    }

    async generate(query, maxLength) {
        const jsonResponse = await this.postRequest({ messages: [
                {
                    role: 'system',
                    content: 'Si DJ Kai, energetický DJ na rádiu Kai. Si veľmi hype, rozprávaš krátko a východoslovenským nárečím. Text bude prevedený cez text-to-speech.'
                },
                {
                    role: 'user',
                    content: query
                }
            ], temperature: 0.85, max_tokens: maxLength || 400 })
        return jsonResponse.choices[0].message.content
    }

    async postRequest(request) {
        console.time('gpt-query')

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',//'gpt-4',
                n: 1,
                ...request
            })
        })
        const jsonResponse = await response.json()
        console.timeEnd('gpt-query')
        return jsonResponse
    }
}

export const gptClient = new GptClient(process.env.OPENAI_API_KEY)