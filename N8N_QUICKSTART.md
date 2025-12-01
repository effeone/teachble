# n8n - Pose Model Integration - QUICKSTART

## 🚀 Setup rapido in 5 minuti

Questa guida ti mostra come integrare il modello Pose di Teachable Machine in un workflow n8n.

---

## STEP 1: Esporta il tuo modello Teachable Machine

1. Apri https://teachablemachine.withgoogle.com
2. Seleziona il tuo progetto Pose
3. Clicca **"Export Model"** in alto a destra
4. Scegli **"TensorFlow.js"**
5. Clicca **"Download"** oppure copia il link pubblico (es: `https://teachablemachine.withgoogle.com/models/XXXXXX/`)
6. **IMPORTANTE**: Copia l'URL del modello (qui dovrai sostituire `YOUR_MODEL_ID` nei file seguenti)

---

## STEP 2: Setup in n8n

### 2A - Installa le dipendenze

Nel tuo n8n, vai in **Settings > Community Packages** e installa:

```
@tensorflow/tfjs
@teachablemachine/pose
node-fetch (se non già presente)
```

Oppure usa npm direttamente se hai accesso al terminal del tuo n8n:

```bash
npm install @tensorflow/tfjs @teachablemachine/pose node-fetch
```

### 2B - Crea un nuovo Workflow

1. Crea un **nuovo workflow** in n8n
2. Aggiungi questi nodi nella sequenza:

---

## STEP 3: Configura i nodi

### Nodo 1: Webhook (Trigger)

```
Type: Webhook
Method: POST
Path: /pose-prediction
```

**Questo nodo riceve richieste POST con le immagini**

### Nodo 2: Function (Processamento)

```javascript
// IMPORTANTE: Sostituisci "YOUR_MODEL_ID" con il tuo ID reale!
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/';
const tf = require('@tensorflow/tfjs');
const tmPose = require('@teachablemachine/pose');
const fetch = require('node-fetch');

// Carica il modello
let model = await tmPose.load(MODEL_URL, MODEL_URL + 'metadata.json');

// Recupera l'immagine dall'input
const imageUrl = $input.first().json.imageUrl;

// Carica immagine
const response = await fetch(imageUrl);
const buffer = await response.buffer();
const img = await tf.node.decodeImage(buffer, 3);

// Stima la pose
const { pose, posenetOutput } = await model.estimatePose(img);
const prediction = await model.predict(posenetOutput);

// Trova la classe con probabilità più alta
let maxPrediction = { className: '', probability: 0 };
for (let i = 0; i < prediction.length; i++) {
  if (prediction[i].probability > maxPrediction.probability) {
    maxPrediction = prediction[i];
  }
}

// Pulisci la memoria
img.dispose();

return [{
  json: {
    detectedPose: maxPrediction.className,
    confidence: (maxPrediction.probability * 100).toFixed(2) + '%',
    allPredictions: prediction.map(p => ({
      className: p.className,
      percentage: (p.probability * 100).toFixed(2) + '%'
    })),
    keypoints: pose.keypoints.map(kp => ({
      part: kp.part,
      x: kp.position.x,
      y: kp.position.y
    }))
  }
}];
```

### Nodo 3: Output (Risposta)

```
Type: Respond to Webhook
Status Code: 200
Response Body: $input
```

**Questo nodo ritorna il risultato al client**

---

## STEP 4: Testa il workflow

### Test con cURL

```bash
curl -X POST http://localhost:5678/webhook/pose-prediction \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg"
  }'
```

### Test da n8n

1. Clicca **"Test workflow"**
2. Nel nodo Webhook, clicca **"Test this node"**
3. Incolla un'immagine URL come test input
4. Osserva l'output

---

## STEP 5: Usa il workflow in produzione

### Opzione A: Attiva il webhook

1. Salva il workflow
2. Clicca **"Activate"**
3. Il webhook sarà disponibile all'URL:
   ```
   https://your-n8n-instance.com/webhook/pose-prediction
   ```

### Opzione B: Richiama da un'applicazione

```javascript
const response = await fetch('https://your-n8n-instance.com/webhook/pose-prediction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/pose.jpg'
  })
});

const result = await response.json();
console.log('Detected Pose:', result.detectedPose);
console.log('Confidence:', result.confidence);
```

---

## 🔧 Troubleshooting

### Errore: "Cannot find module '@teachablemachine/pose'"
- Installa il package dalla UI di n8n o tramite npm
- Riavvia n8n

### Errore: "Model loading failed"
- Controlla che l'URL del modello sia corretto
- Assicurati che la URL sia pubblica (non privata)
- Verifica che il modello sia ancora disponibile su Teachable Machine

### Errore: "Image loading failed"
- Verifica che l'URL dell'immagine sia accessibile pubblicamente
- Usa HTTPS non HTTP
- Controlla CORS (Cross-Origin Resource Sharing)

### Performance lenta
- Riduci la risoluzione dell'immagine prima di inviarla
- Usa GPU se disponibile
- Considera di caricare il modello una sola volta in un nodo esterno

---

## 📚 File disponibili

- **n8n-pose-function.js** - Codice completo del nodo Function
- **index.html** - Pagina di test interattiva (apri nel browser)
- **README.md** - Documentazione completa

---

## 💡 Casi d'uso

✅ Riconoscimento di prese di posizioni yoga/pilates  
✅ Monitoraggio della forma durante esercizi  
✅ Automazione di workflow basati su pose (es: attiva telecamera se in posizione X)  
✅ Analisi di video per estrazione di frame con pose specifiche  
✅ Automazione di workflow quando persona è in posizione specifica  

---

## 📖 Docs ufficiali

- [Teachable Machine](https://teachablemachine.withgoogle.com/)
- [n8n Documentation](https://docs.n8n.io/)
- [TensorFlow.js](https://www.tensorflow.org/js)

---

**Creato per n8n + Teachable Machine Automation**
