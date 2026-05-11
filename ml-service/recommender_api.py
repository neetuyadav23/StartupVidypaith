from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import joblib
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

# CORS – allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Load Models ----------------
try:
    print("🔄 Loading SentenceTransformer model...")
    
    # Load lightweight semantic model directly
    model = SentenceTransformer('all-MiniLM-L6-v2')

    print("🔄 Loading embeddings and startup data...")

    # Load precomputed embeddings and metadata
    startup_embeddings = joblib.load('startup_embeddings.pkl')
    startups = joblib.load('startups_data.pkl')
    kmeans = joblib.load('kmeans_model.pkl')

    print("✅ Semantic recommendation system loaded successfully")

except Exception as e:
    print("❌ Failed to load semantic models:", e)
    raise


# ---------------- Request Models ----------------
class Query(BaseModel):
    text: str
    top_k: int = 5


class StartupId(BaseModel):
    startup_id: str


# ---------------- Semantic Search ----------------
@app.post("/recommend")
def recommend(q: Query):

    # Convert query into embedding vector
    query_vec = model.encode([q.text])

    # Compute cosine similarity
    sims = cosine_similarity(query_vec, startup_embeddings).flatten()

    # Get top matches
    top_idx = sims.argsort()[-q.top_k:][::-1]

    results = []

    for idx in top_idx:
        score = float(sims[idx])

        results.append({
            "id": startups[idx]['id'],
            "name": startups[idx]['name'],
            "description": startups[idx]['description'],
            "industry": startups[idx]['industry'],
            "hiring": startups[idx]['hiring'],
            "looking_for": startups[idx]['looking_for'],
            "score": round(score, 4)
        })

    return {
        "recommendations": results
    }


# ---------------- Similar Startups ----------------
@app.post("/similar_startups")
def similar_startups(data: StartupId):

    target = next(
        (s for s in startups if s["id"] == data.startup_id),
        None
    )

    if not target:
        return {"error": "Startup not found"}

    cluster = target.get("cluster", -1)

    similar = [
        {
            "id": s["id"],
            "name": s["name"],
            "description": s["description"],
            "industry": s["industry"],
            "hiring": s["hiring"],
            "looking_for": s["looking_for"]
        }
        for s in startups
        if s.get("cluster", -1) == cluster
        and s["id"] != data.startup_id
    ]

    return {
        "cluster": cluster,
        "similar_startups": similar
    }


# ---------------- Health Check ----------------
@app.get("/")
def health_check():
    return {
        "status": "ML recommendation service running"
    }


# ---------------- Run Server ----------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)