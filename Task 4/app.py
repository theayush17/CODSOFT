from flask import Flask, render_template, request, jsonify
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# Sample movie dataset (you can replace it with a real dataset)
movies = pd.DataFrame({
    'title': ["Inception", "Interstellar", "The Matrix", "The Dark Knight", "Avatar"],
    'description': [
        "A thief who enters the dreams of others to steal secrets.",
        "A team of explorers travel through a wormhole in space.",
        "A hacker discovers the nature of reality and his role in it.",
        "Batman faces the Joker, a criminal mastermind.",
        "A marine on an alien planet gets caught in a conflict."
    ]
})

# Vectorizing the movie descriptions
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(movies['description'])
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

# Function to get movie recommendations
def get_recommendations(movie_title):
    if movie_title not in movies['title'].values:
        return ["Movie not found"]
    idx = movies.index[movies['title'] == movie_title][0]
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:4]  # Top 3 similar movies
    movie_indices = [i[0] for i in sim_scores]
    return movies['title'].iloc[movie_indices].tolist()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    movie_name = data['movie']
    recommendations = get_recommendations(movie_name)
    return jsonify({'recommendations': recommendations})

if __name__ == '__main__':
    app.run(debug=True)
