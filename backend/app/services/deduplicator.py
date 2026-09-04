import logging
from typing import List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.article import NormalizedArticle

logger = logging.getLogger(__name__)

def deduplicate_articles(
    articles: List[NormalizedArticle],
    similarity_threshold: float = 0.70
) -> Tuple[List[NormalizedArticle], int, int]:
    """
    Groups near-duplicate syndicated news articles using TF-IDF cosine similarity.
    Returns:
    - enriched_articles: List of articles with cluster_id and is_primary_in_cluster
    - total_unique_clusters: count of distinct story groups
    - distinct_sources_count: count of unique source names
    """
    if not articles:
        return [], 0, 0

    if len(articles) == 1:
        articles[0].cluster_id = 0
        articles[0].is_primary_in_cluster = True
        return articles, 1, 1

    # Prepare corpus from title + description
    texts = [f"{a.title} {a.description or ''}" for a in articles]
    
    try:
        vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        tfidf_matrix = vectorizer.fit_transform(texts)
        sim_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

        clusters: List[List[int]] = []
        assigned = set()

        for i in range(len(articles)):
            if i in assigned:
                continue
            current_cluster = [i]
            assigned.add(i)
            for j in range(i + 1, len(articles)):
                if j not in assigned and sim_matrix[i, j] >= similarity_threshold:
                    current_cluster.append(j)
                    assigned.add(j)
            clusters.append(current_cluster)

        # Assign cluster IDs and mark primary representative
        for cluster_idx, member_indices in enumerate(clusters):
            for rank, idx in enumerate(member_indices):
                articles[idx].cluster_id = cluster_idx
                articles[idx].is_primary_in_cluster = (rank == 0)

        distinct_sources = len(set(a.source_name.strip().lower() for a in articles if a.source_name))
        return articles, len(clusters), distinct_sources
    except Exception as e:
        logger.error(f"Deduplication failed: {e}. Defaulting to individual clusters.")
        for idx, a in enumerate(articles):
            a.cluster_id = idx
            a.is_primary_in_cluster = True
        distinct_sources = len(set(a.source_name.strip().lower() for a in articles if a.source_name))
        return articles, len(articles), distinct_sources
