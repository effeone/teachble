# 👍 Thumbs Up Gesture Trigger - n8n Workflow

## 🎯 Obiettivo

Questo workflow **riconosce il gesto "Thumbs Up"** dalla webcam usando il tuo modello Pose e **trigghera un'azione** ogni volta che lo rilevi.

---

## 📋 Setup del Workflow

### **Nodo 1: Cron Job** (Loop ogni 2 secondi)

```
Type: Cron
Trigger interval: Every 2 seconds
```

**Questo nodo avvia il loop continuo di riconoscimento**

---

### **Nodo 2: HTTP Request** (Cattura frame webcam)

```
Type: HTTP Request
Method: GET
URL: http://localhost:8000/capture  // endpoint locale per catturare frame
```

**OP ZIONE ALTERNATIVA (più semplice):**
Se non hai un server locale, puoi usare un URL pubblica di immagine per il test.

---

### **Nodo 3: Function** (Pose Prediction - Thumbs Up Detection)

```javascript
const tf = require('@tensorflow/tfjs');
const tmPose = require('@teachablemachine/pose');
const fetch = require('node-fetch');

const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/GBxnPP4k3/';

let model = null;

// Carica il modello
async function loadModel() {
  if (!model) {
    model = await tmPose.load(MODEL_URL, MODEL_URL + 'metadata.json');
  }
  return model;
}

// Main function
async function detectThumbsUp() {
  try {
    await loadModel();
    
    // Prendi l'immagine dall'input
    const imageUrl = $input.first().json.imageUrl || 'https://via.placeholder.com/640x480';
    
    // Carica immagine
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    const img = await tf.node.decodeImage(buffer, 3);
    
    // Stima pose e predizione
    const { pose, posenetOutput } = await model.estimatePose(img);
    const prediction = await model.predict(posenetOutput);
    
    // Class 3 è "Thumbs Up"
    const thumbsUpClass = prediction[2]; // Index 2 = Class 3
    const thumbsUpConfidence = thumbsUpClass.probability;
    
    img.dispose();
    
    return [{
      json: {
        detectedPose: thumbsUpClass.className,
        confidence: (thumbsUpConfidence * 100).toFixed(2),
        isThumbsUp: thumbsUpConfidence > 0.8, // Trigger se > 80%
        allPredictions: prediction,
        timestamp: new Date().toISOString()
      }
    }];
    
  } catch (error) {
    $logger.error('Error:', error);
    return [{ json: { error: error.message } }];
  }
}

await detectThumbsUp();
```

---

### **Nodo 4: IF Condition** (Verifica Thumbs Up)

```
Condition: $json.isThumbsUp == true

True Branch → Nodo 5 (Action Trigger)
False Branch → END (Do Nothing)
```

---

### **Nodo 5: Action Trigger** (Esegui azione)

**Scegli una o più opzioni:**

#### A) Invia Notifica
```
Type: Send Email / Slack / Telegram
Message: "👍 Thumbs Up riconosciuto! Confidence: {{ $json.confidence }}%"
```

#### B) Chiama Webhook
```
Type: HTTP Request
Method: POST
URL: https://your-api.com/endpoint
Body: { "gesture": "thumbs_up", "confidence": $json.confidence }
```

#### C) Aggiorna Database
```
Type: PostgreSQL / Google Sheets
Query: INSERT INTO gestures (name, confidence, timestamp) VALUES ('thumbs_up', {{ $json.confidence }}, NOW())
```

#### D) Attiva Smart Home
```
Type: HTTP Request
URL: https://your-home-automation.com/action
Body: { "action": "toggle_light" }
```

---

## 🔧 Setup Webcam Locale (CONSIGLIATO)

Per catturare frame dalla webcam, usa uno di questi server:

### **Opzione 1: Node.js + Express (VELOCE)**

```bash
npm install express
```

```javascript
// server.js
const express = require('express');
const app = express();

app.get('/capture', (req, res) => {
  // Qui catturi il frame dalla webcam
  // Ritorna immagine base64 o URL
  res.json({ imageUrl: 'frame_url_or_base64' });
});

app.listen(8000, () => console.log('Server on :8000'));
```

### **Opzione 2: Python (OpenCV)**

```bash
pip install flask opencv-python
```

```python
# app.py
from flask import Flask, jsonify
import cv2
import base64

app = Flask(__name__)
cap = cv2.VideoCapture(0)

@app.route('/capture', methods=['GET'])
def capture():
    ret, frame = cap.read()
    _, buffer = cv2.imencode('.jpg', frame)
    img_base64 = base64.b64encode(buffer).decode()
    return jsonify({'imageUrl': f'data:image/jpeg;base64,{img_base64}'})

if __name__ == '__main__':
    app.run(port=8000)
```

---

## ✅ Test del Workflow

1. **Avvia il server locale** (Node.js o Python)
2. **Crea il workflow in n8n** con i 5 nodi
3. **Clicca "Activate"**
4. **Fai il gesto "Thumbs Up" davanti alla webcam**
5. **Osserva l'azione trigggerare!** 🎉

---

## 🐛 Debug

Se il workflow non funziona:

- ✅ Controlla che il modello sia pubblico su Teachable Machine
- ✅ Verifica che la webcam funzioni
- ✅ Controlla i logs di n8n
- ✅ Testa il nodo Function singolarmente
- ✅ Assicurati che `@teachablemachine/pose` e `@tensorflow/tfjs` siano installati

---

## 🚀 Casi d'uso

- 👍 **Approvazione rapida**: Gesto thumbs-up = approva documento
- 🎮 **Gaming**: Usa il gesto come controllo nel gioco
- 📹 **Live streaming**: Reazioni audience in tempo reale
- 🏋️ **Fitness**: Conteggio di esercizi con gesti specifici
- 🤖 **Smart home**: Controlla dispositivi con gesti

---

## 📖 Risorse

- [n8n Docs](https://docs.n8n.io/)
- [Teachable Machine](https://teachablemachine.withgoogle.com/)
- [TensorFlow.js](https://www.tensorflow.org/js)

---

**Created with ❤️ for gesture-based automation**
