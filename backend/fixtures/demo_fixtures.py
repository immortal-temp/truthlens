import re
from typing import List, Dict, Any
from app.models.article import NormalizedArticle

# Curated pre-captured real articles for demo mode and gold-set benchmarking
FIXTURE_ARTICLES: List[Dict[str, Any]] = [
    # Topic 1: Chandrayaan-3 Moon Landing (True Claim - Aug 2023)
    {
        "title": "Chandrayaan-3: India makes historic landing near Moon's south pole",
        "description": "India has made history as its Chandrayaan-3 mission successfully lands on the uncharted south pole of the Moon.",
        "url": "https://www.bbc.com/news/world-asia-india-66594520",
        "source_name": "BBC News",
        "published_at": "2023-08-23T12:34:00Z",
        "content": "India's Moon mission Chandrayaan-3 successfully touched down near the lunar south pole on Wednesday August 23, 2023, making India the first country to land in the rugged southern polar region and the fourth country to achieve a soft lunar landing.",
        "query_used": "Chandrayaan-3 moon landing south pole"
    },
    {
        "title": "India's Chandrayaan-3 spacecraft touches down on moon in historic moment",
        "description": "The Indian Space Research Organisation (ISRO) successfully lands its Vikram lander on the lunar surface.",
        "url": "https://www.thehindu.com/sci-tech/science/isro-chandrayaan-3-moon-landing-live-updates/article67226279.ece",
        "source_name": "The Hindu",
        "published_at": "2023-08-23T12:45:00Z",
        "content": "ISRO achieved a historic milestone on August 23, 2023 as the Vikram lander of Chandrayaan-3 made a soft landing on the south pole of the Moon.",
        "query_used": "Chandrayaan 3 lunar landing August 2023"
    },
    {
        "title": "India Lands Chandrayaan-3 on the Moon in Milestone for Lunar Exploration",
        "description": "India joined the United States, the Soviet Union and China in completing a soft landing on the moon.",
        "url": "https://www.nytimes.com/2023/08/23/science/chandrayaan-3-india-moon-landing.html",
        "source_name": "The New York Times",
        "published_at": "2023-08-23T13:10:00Z",
        "content": "The Chandrayaan-3 lander reached the lunar surface on Wednesday, cementing India's status as a major space power.",
        "query_used": "India moon landing ISRO"
    },
    
    # Topic 2: UNESCO Indian National Anthem (Fabricated Claim / False)
    {
        "title": "Fact Check: UNESCO did not declare Jana Gana Mana as best national anthem",
        "description": "A viral WhatsApp message claiming UNESCO voted India's national anthem as the world's best is completely fake.",
        "url": "https://www.thequint.com/news/webqoof/fact-check-unesco-declares-jana-gana-mana-best-national-anthem",
        "source_name": "The Quint",
        "published_at": "2021-08-15T08:00:00Z",
        "content": "UNESCO has repeatedly clarified that it never conducts competitions or awards for national anthems. The claim that Jana Gana Mana was declared the best anthem in the world is a recurring hoax that has circulated since 2008.",
        "query_used": "UNESCO best national anthem Jana Gana Mana"
    },
    {
        "title": "UNESCO never declared Jana Gana Mana the best national anthem: Clarification",
        "description": "Officials at UNESCO confirm no such award or declaration exists.",
        "url": "https://timesofindia.indiatimes.com/india/unesco-best-anthem-hoax/articleshow/7123910.cms",
        "source_name": "The Times of India",
        "published_at": "2020-01-26T10:00:00Z",
        "content": "The viral forward claiming UNESCO declared the Indian national anthem as the 'Best Anthem in the World' is false. UNESCO has confirmed no such evaluation was ever performed.",
        "query_used": "UNESCO best national anthem"
    },

    # Topic 3: Notre Dame Cathedral Fire (Old News Presented as New in 2026)
    {
        "title": "Notre-Dame cathedral fire: Massive blaze devastates Paris landmark",
        "description": "A massive fire engulfed the medieval Cathedral of Notre-Dame in Paris, toppling its spire.",
        "url": "https://www.reuters.com/article/us-france-notredame-fire-idUSKCN1RR1UO",
        "source_name": "Reuters",
        "published_at": "2019-04-15T18:50:00Z",
        "content": "A colossal fire swept through the 850-year-old Notre-Dame Cathedral in central Paris on April 15, 2019, causing its iconic spire and roof to collapse before firefighters contained the blaze.",
        "query_used": "Notre Dame fire Paris cathedral"
    },
    {
        "title": "Paris Cathedral Notre-Dame engulfed in flames as world watches in horror",
        "description": "Historic April 2019 fire severely damaged the Notre-Dame Cathedral.",
        "url": "https://www.lemonde.fr/en/notre-dame-fire-2019",
        "source_name": "Le Monde",
        "published_at": "2019-04-16T06:00:00Z",
        "content": "On April 15 2019, an accidental fire broke out in the attic of Notre-Dame de Paris during restoration work.",
        "query_used": "Notre Dame fire 2019"
    },

    # Topic 4: James Webb Space Telescope first deep field image (True Claim - July 2022)
    {
        "title": "NASA's Webb Delivers Deepest Infrared Image of Universe Yet",
        "description": "President Joe Biden reveals the first full-color operational image from NASA's James Webb Space Telescope.",
        "url": "https://www.nasa.gov/press-release/nasa-s-webb-delivers-deepest-infrared-image-of-universe-yet",
        "source_name": "NASA",
        "published_at": "2022-07-11T22:30:00Z",
        "content": "NASA's James Webb Space Telescope has produced the deepest and sharpest infrared image of the distant universe to date, known as Webb's First Deep Field (SMACS 0723).",
        "query_used": "James Webb first deep field image NASA 2022"
    },
    {
        "title": "Webb telescope reveals cosmic cliffs and sparkling galaxies in first images",
        "description": "Astronomers celebrate historic release of deep space telescope images.",
        "url": "https://www.nature.com/articles/d41586-022-01906-6",
        "source_name": "Nature",
        "published_at": "2022-07-12T14:00:00Z",
        "content": "NASA, ESA and CSA released the first suite of science images from the James Webb Space Telescope on July 12, 2022.",
        "query_used": "JWST first images July 2022"
    },

    # Topic 5: WHO Declares End to COVID-19 Global Health Emergency (True Claim - May 2023)
    {
        "title": "WHO chief declares end to COVID-19 as global health emergency",
        "description": "Dr Tedros Adhanom Ghebreyesus declares COVID-19 is no longer a public health emergency of international concern.",
        "url": "https://news.un.org/en/story/2023/05/1136367",
        "source_name": "UN News",
        "published_at": "2023-05-05T13:00:00Z",
        "content": "The head of the World Health Organization (WHO) declared on May 5, 2023 that COVID-19 no longer constitutes a public health emergency of international concern (PHEIC).",
        "query_used": "WHO COVID emergency end May 2023"
    },

    # Topic 6: Microchips in COVID vaccines (Fabricated / False)
    {
        "title": "Fact Check: COVID-19 vaccines do not contain microchips or tracking devices",
        "description": "Conspiracy claims that vaccines contain RFID chips are medically impossible and baseless.",
        "url": "https://www.reuters.com/article/factcheck-coronavirus-vaccine-microchip-idUSL1N2M70MW",
        "source_name": "Reuters Fact Check",
        "published_at": "2021-04-20T11:00:00Z",
        "content": "There is no microchip in COVID-19 vaccines. The claim that vaccines track recipients via radio frequency or 5G is false and biologically impossible.",
        "query_used": "COVID vaccine microchip tracking"
    }
]

def get_demo_articles_for_queries(queries: List[str], claim_text: str) -> List[NormalizedArticle]:
    """Matches fixture articles against search terms and returns the top relevant articles."""
    query_str = " ".join(queries).lower() + " " + claim_text.lower()
    scored = []
    
    words = set([w for w in re.findall(r'\b[a-zA-Z0-9_-]+\b', query_str) if len(w) > 3])

    for f in FIXTURE_ARTICLES:
        title_words = set(re.findall(r'\b[a-zA-Z0-9_-]+\b', f["title"].lower()))
        content_words = set(re.findall(r'\b[a-zA-Z0-9_-]+\b', f["content"].lower()))
        
        score = len(words.intersection(title_words)) * 3 + len(words.intersection(content_words))
        if score > 0:
            scored.append((score, NormalizedArticle(**f)))
            
    if scored:
        scored.sort(key=lambda x: x[0], reverse=True)
        # Return all articles that scored at least 40% of the top score
        top_score = scored[0][0]
        threshold = max(2, int(top_score * 0.4))
        return [art for sc, art in scored if sc >= threshold]

    # Default fallback
    return [NormalizedArticle(**f) for f in FIXTURE_ARTICLES[:3]]
