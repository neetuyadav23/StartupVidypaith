# train_semantic.py
import json
import joblib
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans

# Load startup data (must have 'text' field)
with open('startups.json', 'r') as f:
    startups = json.load(f)

texts = [s['text'] for s in startups]

# Load a lightweight, fast semantic model
model = SentenceTransformer('all-MiniLM-L6-v2')   # ~80MB, good for CPU

# Compute embeddings (vectors that capture meaning)
embeddings = model.encode(texts, show_progress_bar=True)

# (Optional) Cluster the embeddings – for "Other startups you might like"
n_clusters = 4   # adjust based on number of startups
kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
clusters = kmeans.fit_predict(embeddings)

# Attach cluster to each startup
for i, s in enumerate(startups):
    s['cluster'] = int(clusters[i])

# Save everything
joblib.dump(model, 'semantic_model.pkl')
joblib.dump(embeddings, 'startup_embeddings.pkl')
joblib.dump(startups, 'startups_data.pkl')
joblib.dump(kmeans, 'kmeans_model.pkl')

print(f"✅ Semantic model trained on {len(startups)} startups → {n_clusters} clusters")