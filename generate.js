const nunjucks = require('nunjucks');
const fs = require('fs');
const path = require('path');
const https = require('https');

class GeneratePDF {
    constructor(inputTexFile, outputPDF, jsonData) {
        this.inputTexFile = inputTexFile;
        this.outputPDF = outputPDF;
        this.jsonData = jsonData;
    }

    _downloadImage(url, dest) {
        console.log(`Downloading image from ${url} to ${dest}`);
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest);
            https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => {
                        console.log(`Downloaded image to ${dest}`);
                        resolve();
                    });
                });
            }).on('error', (err) => {
                fs.unlink(dest, () => reject(err.message));
            });
        });
    }

    async _download_images(data, imgCount = 0, imgDir = 'images') {
        if (!fs.existsSync(imgDir)){
            fs.mkdirSync(imgDir);
        }

        const downloadRecursive = async (data) => {
            if (typeof data === 'object' && data !== null) {
                for (let key in data) {
                    if (key === 'image') {
                        imgCount += 1;
                        const imgPath = path.resolve(imgDir, `img${imgCount}.png`);
                        await this._downloadImage(data[key], imgPath);
                        data[key] = imgPath.replace(/\\/g, '/');
                    } else {
                        await downloadRecursive(data[key]);
                    }
                }
            } else if (Array.isArray(data)) {
                for (let i = 0; i < data.length; i++) {
                    await downloadRecursive(data[i]);
                }
            }
            return data;
        };

        return downloadRecursive(data);
    }

    async _nunjucksToLatex() {
        console.log("Converting the nunjucks to latex template");

        // Read the LaTeX template file
        const template = fs.readFileSync(this.inputTexFile, 'utf-8');

        // Read the JSON data file
        let data = this.jsonData;

        // Download images from the data
        data = await this._download_images(data);
        console.log("Image download complete, updated data: ", data);

        // Configure Nunjucks
        nunjucks.configure({ autoescape: false });

        // Render the LaTeX template with the JSON data
        const renderedLatex = nunjucks.renderString(template, data);

        console.log("Conversion done\n\n\n");
        return renderedLatex;
    }

    generate() {
        return new Promise((resolve, reject) => {
            console.log(">>> generate.js");
            // // Supprime le fichier s'il existe
            // if (fs.existsSync(this.outputPDF)) {
            //     fs.unlinkSync(this.outputPDF);
            // }

            // Rendre le modèle LaTeX
            this._nunjucksToLatex().then((renderedLatex) => {
                // Écrire le LaTeX rendu dans un fichier
                const lang = this.outputPDF.includes('fr') ? 'fr' : 'en';
                const outputTexFile = `output-${lang}.tex`;
                fs.writeFileSync(outputTexFile, renderedLatex);

                // Compiler le fichier LaTeX en PDF
                const { exec } = require('child_process');
                
                // list all images in the images folder
                const images = fs.readdirSync('images');
                console.log("Images: ", images);

                exec(`pdflatex -interaction=nonstopmode -jobname=${this.outputPDF.split(".")[0]} ${outputTexFile}`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Erreur lors de l'exécution de pdflatex: ${error}`);
                        console.log(`stdout: ${stdout}`);
                        console.error(`stderr: ${stderr}`);
                        reject(error); // Rejeter la promesse avec l'erreur
                    } else {
                        console.log("PDF généré avec succès.");
                        console.log(`Path to the generated PDF: ${this.outputPDF}`);
                        resolve(); // Résoudre la promesse
                    }
                });
            }).catch((err) => {
                console.error("Erreur lors du rendu LaTeX: ", err);
                reject(err); // Rejeter la promesse avec l'erreur
            });
        });
    }
}

// let jsonData = JSON.parse(fs.readFileSync("template.json", 'utf-8'))
// let generate = new GeneratePDF("template/texFileFr.tex", "build/output-fr.pdf", jsonData);
// generate.generate();

module.exports = { GeneratePDF };