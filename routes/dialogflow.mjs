import { Router } from 'express';
import fs from 'fs';
import stream from 'stream';
import { v2beta1 as dialogflow } from '@google-cloud/dialogflow';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import * as dotenv from 'dotenv'
dotenv.config()


const router = Router()

const CREDENTIALS = JSON.parse(process.env.CREDENTIALS)
// console.log(CREDENTIALS);
const PROJECT_ID = CREDENTIALS.project_id
const PRIVATE_KEY = CREDENTIALS.private_key.split(String.raw`\n`).join('\n')

// console.log(PROJECT_ID);

const CONFIGURATION = {
    credentials: {
        private_key: PRIVATE_KEY,
        client_email: CREDENTIALS['client_email']
    }
}

function generateRandomFilename() {
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const randomNum = Math.floor(Math.random() * 1000000);
    const filename = `${timestamp}_${randomNum}`;
    return filename;
}

async function conversion(base64Data, callback) {
    return new Promise((resolve, reject) => {

        ffmpeg.setFfmpegPath(ffmpegPath);

        // create a Readable stream from the Blob
        // const blob = /* your Blob object */;
        const streamData = new stream.PassThrough();
        streamData.end(Buffer.from(base64Data, 'base64'));


        // set up the ffmpeg command to convert the audio file
        const command = ffmpeg(streamData)
            .noVideo()
            .audioCodec('libmp3lame')
            .format('mp3');

        // create a Writable stream to save the output file
        const filename = generateRandomFilename()
        // console.log(outputFilePath);
        // if (!fs.existsSync('audio')) {
        //     fs.mkdirSync('audio');
        //     console.log(`Folder '${'audio'}' created successfully!`);
        // }
        const outputFilePath = `/tmp/${filename}.mp3`;
        const outputFileStream = fs.createWriteStream(outputFilePath);

        // run the ffmpeg command and save the output to the file
        command.pipe(outputFileStream);
        command.on('end', () => {
            console.log('Conversion complete');
            // console.log(outputFileStream.path);
            // fs.readFile(outputFilePath, async (err, data) => {
            //     if (err) {
            //         console.log(`Error reading file: ${err.message}`);
            //         // callback(err);
            //         return;
            //     }
            //     // console.log(data);
            //     await detectAudioIntent(data)
            //     // callback(null, data);
            // });
            resolve(outputFilePath);

        });
        command.on('error', (err) => {
            console.log(`Error: ${err.message}`);
            reject(err.message);

        });
    });

}


// Instantiates a session client

async function detectIntent(query, userId, base64Data) {
    const sessionClient = new dialogflow.SessionsClient(CONFIGURATION);
    const knowledgeBaseId = 'MTEzMTAzOTczODg3MzQwNzA3ODQ'
    const knowledgeBasePath =
        'projects/' + PROJECT_ID + '/knowledgeBases/' + knowledgeBaseId + '';

    const sessionPath = sessionClient.projectAgentSessionPath(
        PROJECT_ID,
        userId
    );

    let queryData = {};
    if (query) {
        queryData = {
            queryInput: {
                text: {
                    text: query,
                    languageCode: 'en-US',
                },
            },
        }
    } else {
        const filePath = await conversion(base64Data)
        const audioFile = fs.readFileSync(filePath);

        queryData = {
            queryInput: {
                audioConfig: {
                    audioEncoding: 'AUDIO_ENCODING_MP3',
                    sampleRateHertz: 24000,
                    languageCode: 'en-US',
                },
            },
            inputAudio: audioFile
        }
        try {
            fs.unlinkSync(filePath)
            //file removed
        } catch (err) {
            console.error(err)
        }
    }

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: queryData.queryInput,
        queryParams: {
            knowledgeBaseNames: [knowledgeBasePath],
            payload: {
                userId: userId
            },
        },

        inputAudio: !query && queryData.inputAudio
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult
    // console.log(responses[0]?.queryResult);
    // console.log(responses[0]?.outputAudio);

    const intent = responses[0]?.queryResult?.intent?.displayName
    const fulfillmentText = result?.fulfillmentText
    const params = result?.parameters
    const context = result?.outputContexts
    const queryText = result?.queryText
    console.log(queryText);


    let messages = [];

    responses[0]?.queryResult?.fulfillmentMessages?.map(eachMessage => {
        if (eachMessage.platform === "PLATFORM_UNSPECIFIED") {

            eachMessage.text && messages.push({
                sender: "chatbot",
                text: eachMessage?.text?.text[0]
            })

        }
    })
    messages.push({ sender: "chatbot", audio: responses[0]?.outputAudio })
    // console.log(messages);
    return {
        messages,
        responses,
        intent,
        fulfillmentText,
        params,
        context,
        queryText
    }
}

async function detectAudioIntent(audioData) {
    const sessionClient = new dialogflow.SessionsClient(CONFIGURATION);

    const sessionPath = sessionClient.projectAgentSessionPath(
        PROJECT_ID,
        'userId123'
    );

    const request = {
        session: sessionPath,
        queryInput: {
            audioConfig: {
                audioEncoding: 'AUDIO_ENCODING_MP3',
                sampleRateHertz: 24000,
                languageCode: 'en-US',
            },
        },
        inputAudio: audioData,
    };
    const [response] = await sessionClient.detectIntent(request);
    // console.log(response);

    console.log('Detected intent:');
    const result = response.queryResult;
    console.log(result);

    const contextClient = new dialogflow.ContextsClient();

    console.log(`  Query: ${result.queryText}`);
    console.log(`  Response: ${result.fulfillmentText}`);
    if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
    } else {
        console.log('  No intent matched.');
    }
    console.log(`  Parameters: ${result.parameters}`);
    if (result.outputContexts && result.outputContexts.length) {
        console.log('  Output contexts:');
        result.outputContexts.forEach(context => {
            const contextId =
                contextClient.matchContextFromProjectAgentSessionContextName(
                    context.name
                );
            const contextParameters = JSON.stringify(
                struct.decode(context.parameters)
            );
            console.log(`${contextId}`);
            console.log(`lifespan: ${context.lifespanCount}`);
            console.log(`parameters: ${contextParameters}`);
        });
    }

}


router.post('/', async (req, res) => {
    // console.log(req.body);
    const query = req.body.msg
    const base64Data = req.body.audioData;
    const userId = req.body.userId

    const response = await detectIntent(
        query ? req.body.msg : null,
        userId,
        !query ? base64Data : null
    );
    // console.log(response);

    res.status(200).send(response)

});

export default router