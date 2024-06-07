import fetch from 'node-fetch'

const API_URL = 'https://api.openai.com/v1/chat/completions'

export default class GptClient {
    token

    constructor(token) {
        this.token = token
    }

    async generate(query) {
        const jsonResponse = await this.postRequest({ messages: [
                {
                    role: 'system',
                    content: 'Si DJ Kai, energetický DJ na rádiu Kai. Si veľmi hype, rozprávaš krátko a východoslovenským nárečím.'
                },
                {
                    role: 'user',
                    content: query
                }
            ], temperature: 0.85 })
        return jsonResponse.choices[0].message.content
    }

    async postRequest(request) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',//'gpt-4',
                max_tokens: 400,
                n: 1,
                ...request
            })
        })
        const jsonResponse = await response.json()
        return jsonResponse
    }
}