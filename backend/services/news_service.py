"""
News Service - Financial News Aggregation and AI Summarization
Fetches financial news and uses OpenAI to generate concise summaries
"""
import requests
from datetime import datetime
import os
from openai import OpenAI


class NewsService:
    """Service for fetching and summarizing financial news"""
    
    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.client = None
        
        # Initialize OpenAI client if API key is available
        if self.openai_api_key and self.openai_api_key != 'your-openai-api-key':
            try:
                self.client = OpenAI(api_key=self.openai_api_key)
            except Exception as e:
                print(f"⚠️ OpenAI initialization failed: {str(e)}")
                self.client = None
        
        # NewsAPI configuration (alternative: you can use any news API)
        self.news_api_key = os.getenv('NEWS_API_KEY')
        self.news_api_url = "https://newsapi.org/v2/everything"
    
    def fetch_financial_news(self, keywords='financial markets crypto', limit=5):
        """
        Fetch financial news from NewsAPI or similar service
        
        Args:
            keywords: Search keywords
            limit: Number of articles to fetch
        
        Returns:
            List of news articles
        """
        try:
            # If NewsAPI key is available, use it
            if self.news_api_key and self.news_api_key != 'your-news-api-key':
                params = {
                    'q': keywords,
                    'apiKey': self.news_api_key,
                    'language': 'en',
                    'sortBy': 'publishedAt',
                    'pageSize': limit
                }
                
                response = requests.get(self.news_api_url, params=params, timeout=10)
                response.raise_for_status()
                
                data = response.json()
                articles = data.get('articles', [])
                
                return [
                    {
                        'title': article.get('title'),
                        'description': article.get('description'),
                        'url': article.get('url'),
                        'source': article.get('source', {}).get('name'),
                        'published_at': article.get('publishedAt'),
                        'image': article.get('urlToImage')
                    }
                    for article in articles[:limit]
                ]
            
            # Fallback: Return simulated news for testing
            return self._get_simulated_news(limit)
            
        except Exception as e:
            print(f"❌ Error fetching news: {str(e)}")
            return self._get_simulated_news(limit)
    
    def _get_simulated_news(self, limit=5):
        """Generate simulated financial news for testing"""
        simulated_news = [
            {
                'title': 'Bitcoin Reaches New All-Time High',
                'description': 'Bitcoin surpasses $100,000 mark amid growing institutional adoption and favorable regulatory developments.',
                'source': 'CryptoNews',
                'published_at': datetime.utcnow().isoformat(),
                'url': 'https://example.com/news1'
            },
            {
                'title': 'Moroccan Stock Market Shows Strong Growth',
                'description': 'Casablanca Stock Exchange reports record trading volumes as international investors show increased interest in Moroccan equities.',
                'source': 'Financial Times Morocco',
                'published_at': datetime.utcnow().isoformat(),
                'url': 'https://example.com/news2'
            },
            {
                'title': 'IAM Reports Quarterly Earnings Beat',
                'description': 'Itissalat Al-Maghrib announces better-than-expected quarterly results driven by 5G rollout and digital services expansion.',
                'source': 'BVC News',
                'published_at': datetime.utcnow().isoformat(),
                'url': 'https://example.com/news3'
            },
            {
                'title': 'Ethereum Upgrade Boosts Network Performance',
                'description': 'Latest Ethereum network upgrade significantly reduces transaction costs and increases processing speed.',
                'source': 'Blockchain Today',
                'published_at': datetime.utcnow().isoformat(),
                'url': 'https://example.com/news4'
            },
            {
                'title': 'Central Banks Consider Digital Currency Plans',
                'description': 'Major central banks worldwide accelerate plans for central bank digital currencies (CBDCs) amid growing crypto adoption.',
                'source': 'Reuters',
                'published_at': datetime.utcnow().isoformat(),
                'url': 'https://example.com/news5'
            }
        ]
        
        return simulated_news[:limit]
    
    def summarize_with_openai(self, text, max_lines=3):
        """
        Summarize text using OpenAI GPT
        
        Args:
            text: Text to summarize
            max_lines: Maximum number of lines in summary (default 3)
        
        Returns:
            Summarized text
        """
        if not self.client:
            # Fallback: Return truncated text if OpenAI is not available
            return self._simple_summarize(text, max_lines)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a financial news summarizer. Summarize the following news in exactly {max_lines} concise lines, focusing on key financial implications."
                    },
                    {
                        "role": "user",
                        "content": text
                    }
                ],
                max_tokens=150,
                temperature=0.5
            )
            
            summary = response.choices[0].message.content.strip()
            return summary
            
        except Exception as e:
            print(f"⚠️ OpenAI summarization failed: {str(e)}")
            return self._simple_summarize(text, max_lines)
    
    def _simple_summarize(self, text, max_lines=3):
        """Simple text truncation fallback when OpenAI is not available"""
        if not text:
            return ""
        
        # Split into sentences
        sentences = text.split('. ')
        
        # Take first N sentences
        summary_sentences = sentences[:max_lines]
        summary = '. '.join(summary_sentences)
        
        # Add period if not present
        if not summary.endswith('.'):
            summary += '.'
        
        return summary
    
    def get_summarized_news(self, keywords='financial markets crypto', limit=5):
        """
        Fetch news and return with AI-generated summaries
        
        Returns:
            List of news with summaries
        """
        news_articles = self.fetch_financial_news(keywords, limit)
        
        summarized_news = []
        for article in news_articles:
            # Combine title and description for summarization
            full_text = f"{article['title']}. {article.get('description', '')}"
            
            # Generate 3-line summary using OpenAI
            summary = self.summarize_with_openai(full_text, max_lines=3)
            
            summarized_news.append({
                'title': article['title'],
                'summary': summary,  # AI-generated 3-line summary
                'source': article['source'],
                'published_at': article['published_at'],
                'url': article.get('url'),
                'image': article.get('image')
            })
        
        return {
            'news': summarized_news,
            'count': len(summarized_news),
            'timestamp': datetime.utcnow().isoformat()
        }
