import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import OpenAI from "openai";
import fs from "fs"



// Initialize Express app
const app = express();
// use this for local host testing: 
// const port = 3000;
const port=process.env.PORT 

// Middleware
// CORS configuration
const corsOptions = {
    origin: '*', // Allow all origins for testing; use specific origin(s) in production for security
    methods: ['GET', 'POST'], // Specify allowed methods
    allowedHeaders: ['Content-Type'], // Specify allowed headers
};
app.use(cors(corsOptions));




app.use(bodyParser.json());


// format message.content before sending it back to qualtrics to make the response more readable. 
const formatResponse = (text) => {
    return text
        .replace(/\n/g, '<br>') // Replace newlines with HTML line breaks
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
        .replace(/^- (.+)$/gm, '<li>$1</li>') // Markdown bullet points
        .replace(/<li>(.+?)<\/li>/g, '<ul><li>$1</li></ul>'); // Wrap list items in <ul>
};


const openai = new OpenAI();
// API endpoint to handle chat requests
app.post('/chat', async (req, res) => {
    const { currentMessage, messageHistory, includeProspectus } = req.body;

    try {
        let prompt = [
            ...messageHistory,
            { role: 'user', content: currentMessage },
        ];

        if (includeProspectus) {
            const prospectusContent = fs.readFileSync('./prospectus.txt', 'utf-8');
            prompt.push({ role: 'user', content: `Prospectus: ${prospectusContent}` });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: prompt,
        });
        //console.log('Prompt sent to OpenAI:',prompt)
        const formattedReply=formatResponse(completion.choices[0].message.content)
        res.json({ reply: formattedReply });
    } catch (error) {
        console.error('Error communicating with OpenAI:', error);
        res.status(500).json({ reply: 'Error occurred while processing your request.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/', (req, res) => {
    res.send('Hello, World! The server is working!');
});