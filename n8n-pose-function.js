/**
 * Teachable Machine Pose Model - n8n Function Node
 * 
 * This function uses Teachable Machine Pose Model for real-time pose detection
 * 
 * Input: { imageUrl: "https://..." }
 * Output: { detectedPose: "className", confidence: 0.95, allPredictions: [...] }
 */

const fetch = require('node-fetch');
const tf = require('@tensorflow/tfjs');
const tmPose = require('@teachablemachine/pose');

// Configuration - MODIFY WITH YOUR MODEL URL
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/';
const METADATA_URL = MODEL_URL + 'metadata.json';
const MODEL_JSON = MODEL_URL + 'model.json';

let model = null;
let isModelLoaded = false;

/**
 * Load the model from Teachable Machine
 */
async function loadModel() {
  if (isModelLoaded) return model;
  
  try {
    $logger.info('Loading Teachable Machine Pose Model...');
    model = await tmPose.load(MODEL_URL, METADATA_URL);
    isModelLoaded = true;
    $logger.info('Model loaded successfully');
    return model;
  } catch (error) {
    $logger.error('Error loading model:', error);
    throw error;
  }
}

/**
 * Fetch and convert image to tensor
 */
async function loadImageFromUrl(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    const img = await tf.node.decodeImage(buffer, 3);
    return img;
  } catch (error) {
    $logger.error('Error loading image:', error);
    throw error;
  }
}

/**
 * Main prediction function
 */
async function predictPose(imageUrl) {
  try {
    // Load model if not already loaded
    if (!isModelLoaded) {
      await loadModel();
    }
    
    // Load image
    const image = await loadImageFromUrl(imageUrl);
    
    // Estimate pose
    const { pose, posenetOutput } = await model.estimatePose(image);
    
    // Get predictions
    const predictions = await model.predict(posenetOutput);
    
    // Find the class with highest probability
    let maxPrediction = null;
    let maxProbability = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i].probability > maxProbability) {
        maxProbability = predictions[i].probability;
        maxPrediction = predictions[i].className;
      }
    }
    
    // Clean up
    image.dispose();
    
    return {
      detectedPose: maxPrediction,
      confidence: maxProbability,
      allPredictions: predictions.map(p => ({
        className: p.className,
        probability: p.probability,
        percentage: (p.probability * 100).toFixed(2) + '%'
      })),
      keypoints: pose.keypoints.map(kp => ({
        part: kp.part,
        position: { x: kp.position.x, y: kp.position.y },
        score: kp.score
      }))
    };
  } catch (error) {
    $logger.error('Prediction error:', error);
    throw error;
  }
}

// Main execution
const items = $input.getAll();
const results = [];

for (const item of items) {
  const imageUrl = item.json.imageUrl;
  
  if (!imageUrl) {
    results.push({
      error: 'Missing imageUrl in input',
      item: item
    });
    continue;
  }
  
  try {
    const prediction = await predictPose(imageUrl);
    results.push({
      json: {
        success: true,
        ...prediction
      }
    });
  } catch (error) {
    results.push({
      json: {
        success: false,
        error: error.message,
        imageUrl: imageUrl
      }
    });
  }
}

return results;
