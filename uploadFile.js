const fs = require('fs');

async function updateRecord(filePath, lang, pb) {
    console.log(`>>> uploadFile.js`);
    // Lire le contenu du fichier PDF
    const fileContent = await fs.promises.readFile(filePath);
    const blob = new Blob([fileContent], { type: 'application/pdf' });

    // Mettre à jour l'enregistrement avec le fichier PDF
    await pb.collection(process.env.POCKETBASE_CV_COLLECTION)
        .update(process.env[`CV_${lang.toUpperCase()}_ID`], { PDF: blob });

    console.log(`Le PDF pour la langue ${lang} a été mis à jour avec succès.`);
}

module.exports = { updateRecord };