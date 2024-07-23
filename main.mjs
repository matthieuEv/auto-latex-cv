import PocketBase from 'pocketbase';
import eventsource from 'eventsource';
import dotenv from 'dotenv';
import { GeneratePDF } from './generate.js';
import { updateRecord } from './uploadFile.js';

global.EventSource = eventsource;

dotenv.config();

async function getRecordChanges(pb, recordId) {
    console.log(`Subscribing to record changes for record ${recordId}...`);
    
    pb.collection('AutoLatexCv').subscribe(recordId, function (e) {
        if (e.action === 'update') {
            console.log(`=== Record ${recordId} updated ===`);
            const data = e.record;
            switch (data.lang) {
                case 'fr':
                    console.log('French record updated');

                    new GeneratePDF("template/texFileFr.tex", "build/output-fr.pdf", data.json)
                        .generate().then(() => {
                            updateRecord('build/output-fr.pdf', 'fr', pb);
                        });
                    break;
            
                case 'en':
                    console.log('English record updated');

                    new GeneratePDF("template/texFileEn.tex", "build/output-en.pdf", data.json)
                        .generate().then(() => {
                            updateRecord('build/output-en.pdf', 'en', pb);
                        });
                    break;
                    
                default:
                    break;
            }
        }
    });
}


async function main() {
    const pb = new PocketBase(process.env.POCKETBASE_URL);
    console.log(`Logged in to PocketBase at ${process.env.POCKETBASE_URL}`);

    // Login as admin
    try {
        const admin = await pb.admins.authWithPassword(
            process.env.POCKETBASE_EMAIL_AUTH,
            process.env.POCKETBASE_PASSWORD_AUTH
        );
    } catch (error) {
        console.log('Error Admin login: ', error);
        process.exit(1);
    }

    try {
        await Promise.all([
            getRecordChanges(pb, process.env.POCKETBASE_AutoLatexCv_RECORD_ID_FR),
            getRecordChanges(pb, process.env.POCKETBASE_AutoLatexCv_RECORD_ID_EN),
        ]);
    } catch (error) {
        console.error(`Error in main execution: ${error}`);
    }
}

main().catch(console.error);