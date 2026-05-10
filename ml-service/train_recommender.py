import json
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

# Load your startup data (must contain 'text', 'name', etc.)
with open('startups.json', 'r') as f:
    startups = json.load(f)

texts = [s['text'] for s in startups]

# TF‑IDF vectorizer
vectorizer = TfidfVectorizer(stop_words='english', max_features=200)
tfidf_matrix = vectorizer.fit_transform(texts)

# K‑Means clustering (adjust n_clusters as needed)
n_clusters = 4   # for ~15 startups, try 3 or 4
kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
clusters = kmeans.fit_predict(tfidf_matrix)

# Attach cluster number to each startup
for i, s in enumerate(startups):
    s['cluster'] = int(clusters[i])

# Save all models and data
joblib.dump(vectorizer, 'recommender_vectorizer.pkl')
joblib.dump(tfidf_matrix, 'recommender_matrix.pkl')
joblib.dump(startups, 'startups_data.pkl')
joblib.dump(kmeans, 'kmeans_model.pkl')

print(f"✅ Trained on {len(startups)} startups → {n_clusters} clusters")