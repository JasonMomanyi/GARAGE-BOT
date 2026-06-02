const axios = require('axios');
require('dotenv').config();

async function test() {
    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openrouter/auto",
                messages: [{ role: "user", content: "Say hello!" }]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log("Success:", response.data.choices[0].message.content);
    } catch (e) {
        console.error("Error:", e.response?.data || e.message);
    }
}
test();
