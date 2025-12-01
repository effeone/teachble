# Teachable Machine Pose Model - n8n Integration Guide

## Overview

Questo progetto contiene l'integrazione del modello Pose di **Teachable Machine** con **n8n** per automazione intelligente basata su riconoscimento di pose.

## Files

- **index.html** - Pagina di testing interattiva per il modello Pose
- **n8n-pose-workflow.json** - Workflow n8n pronto all'uso (prossimamente)
- **README.md** - Documentazione

## Come usare con n8n

### 1. Esporta il tuo modello Teachable Machine

1. Accedi a [Teachable Machine](https://teachablemachine.withgoogle.com)
2. Apri il tuo progetto Pose
3. Clicca su **Export Model**
4. Scegli **TensorFlow.js / JavaScript**
5. Copia l'URL del modello (es: `https://teachablemachine.withgoogle.com/models/XXXXXX/`)

### 2. Crea un workflow n8n

Nel tuo n8n, crea un workflow con questi nodi:

#### Nodo 1: Trigger (Webhook o HTTP)
```
URL: /pose-prediction
Method: POST
Body: { "imageUrl": "https://..." }
```

#### Nodo 2: Function (JavaScript)

```javascript
const TensorFlow = require('tfjs');
const tmPose = require('@teachablemachine/pose');

// Carica il modello
const modelURL = 'https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/';
const metadata = await fetch(modelURL + 'metadata.json').then(r => r.json());
const model = await tmPose.load(modelURL, modelURL + 'metadata.json');

// Carica immagine
const imageUrl = $input.first().json.imageUrl;
const response = await fetch(imageUrl);
const blob = await response.blob();
const img = await createImageBitmap(blob);

// Predizione
const { pose, posenetOutput } = await model.estimatePose(img);
const prediction = await model.predict(posenetOutput);

// Trova la classe con probabilità più alta
let maxPrediction = { className: '', probability: 0 };
for (let i = 0; i < prediction.length; i++) {
  if (prediction[i].probability > maxPrediction.probability) {
    maxPrediction = prediction[i];
  }
}

return { prediction: maxPrediction, allPredictions: prediction };
```

#### Nodo 3: Output

Ritorna il risultato della predizione.

### 3. Opzione alternativa: API HTTP

Puoi anche usare questo repository come base per una **API serverless** su:
- **Google Cloud Functions**
- **AWS Lambda**
- **Vercel**
- **Heroku**

Alloca l'`index.html` e personalizza per fare inference del modello.

## Testing Locale

1. Clona il repository
2. Apri `index.html` nel browser
3. Incolla l'URL del tuo modello Teachable Machine
4. Clicca "Load Model"
5. La webcam inizierà a catturare le pose

## Note

- Le librerie TensorFlow.js e Teachable Machine vanno installate tramite npm nel nodo Function di n8n
- Assicurati che n8n abbia accesso a internete per caricare i modelli da Teachable Machine
- Per performance migliori, usa GPU se disponibile

## Prossimi passi

- [ ] Creare workflow n8n completo
- [ ] Implementare caching del modello
- [ ] Aggiungere supporto per batch predictions
- [ ] Deploy su Cloud Function

---

**Created for n8n automation with Teachable Machine Pose Models**
