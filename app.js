const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const addTextWatermarkToImage = async function (inputFile, outputFile, text) {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
      text: text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };

    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
    console.log('Image with text watermark successfully created!');
    startApp();
  } catch (error) {
    console.log('Something went wrong... Try again!')
  }
};

const addImageWatermarkToImage = async function (inputFile, outputFile, watermarkFile) {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
    console.log('Image with image watermark successfully created!');
    startApp();
  } catch (error) {
    console.log('Something went wrong... Try again!')
  }
};

const prepareOutputFilename = (filename) => {
  const filenameParts = filename.split('.');
  const ext = filenameParts[filenameParts.length - 1];
  return `${filename.slice(0, filename.length - ext.length - 1)}-with-watermark.${ext}`;
};

const prepareOutputFilenameIfEdited = (filename) => {
  const filenameParts = filename.split('.');
  const ext = filenameParts[filenameParts.length - 1];
  return `${filename.slice(0, filename.length - ext.length - 1)}-edited.${ext}`;
};

const startApp = async () => {

  // Ask if user is ready
  const answer = await inquirer.prompt([{
    name: 'start',
    message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
    type: 'confirm'
  }]);

  // if answer is no, just quit the app
  if (!answer.start) process.exit();

  // ask about input file
  const inputFile = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
  }]);

  // Ask if user is ready
  const editPrompt = await inquirer.prompt([{
    name: 'edit',
    message: 'Do you want to edit the input file before adding the watermark?',
    type: 'confirm'
  }]);

  // if answer is no, simply continue with adding the watermark
  if (editPrompt.edit) {
    const editOptions = await inquirer.prompt([{
      name: 'optionName',
      type: 'list',
      choices: [
        'make image brighter',
        'increase contrast',
        'make image b&w',
        'invert image'
      ]
    }])
  }
  else {
    // ask about watermark type
    const options = await inquirer.prompt([{
      name: 'watermarkType',
      type: 'list',
      choices: ['Text watermark', 'Image watermark'],
    }]);

    if (options.watermarkType === 'Text watermark') {
      const text = await inquirer.prompt([{
        name: 'value',
        type: 'input',
        message: 'Type your watermark text:',
      }]);
      options.watermarkText = text.value;
      if (fs.existsSync('img/' + inputFile.inputImage)) {
        addTextWatermarkToImage('./img/' + inputFile.inputImage, './img/' + prepareOutputFilename(inputFile.inputImage), options.watermarkText);
      } else {
        console.log('Something went wrong... Try again.');
      }
    }
    else {
      const image = await inquirer.prompt([{
        name: 'filename',
        type: 'input',
        message: 'Type your watermark name:',
        default: 'logo.png',
      }]);
      options.watermarkImage = image.filename;
      if (fs.existsSync('img/' + inputFile.inputImage) && fs.existsSync('img/' + options.watermarkImage)) {
        addImageWatermarkToImage('./img/' + inputFile.inputImage, './img/' + prepareOutputFilename(inputFile.inputImage), './img/' + options.watermarkImage);
      } else {
        console.log('Something went wrong... Try again.');
      }
    }
  }
};

startApp();