"""
AI Logic Module - Intelligent Property Analysis
Uses rule-based logic and can be extended with ML models
"""
import re
from datetime import datetime, timedelta


class AIAnalyzer:
    """AI-powered property analysis and insights"""
    
    def __init__(self):
        self.keywords_positive = [
            'neuf', 'nouveau', 'rénové', 'moderne', 'luxe', 'vue mer',
            'piscine', 'jardin', 'parking', 'ascenseur', 'climatisation',
            'sécurisé', 'résidence fermée', 'quartier calme'
        ]
        
        self.keywords_negative = [
            'travaux', 'rénovation nécessaire', 'ancien', 'vétuste',
            'bruyant', 'sans ascenseur', 'sombre'
        ]
    
    def analyze_property(self, property_obj):
        """
        Comprehensive AI analysis of a property
        
        Args:
            property_obj: Property model instance
        
        Returns:
            dict: AI insights and recommendations
        """
        insights = {
            'description_analysis': self._analyze_description(property_obj.description or ''),
            'price_analysis': self._analyze_price(property_obj),
            'location_score': self._analyze_location(property_obj),
            'market_position': self._analyze_market_position(property_obj),
            'investment_score': self._calculate_investment_score(property_obj),
            'pros_cons': self._extract_pros_cons(property_obj),
            'similar_properties': self._find_similar_properties(property_obj),
            'prediction': self._predict_market_movement(property_obj)
        }
        
        return insights
    
    def _analyze_description(self, description):
        """Analyze property description for key features"""
        description_lower = description.lower()
        
        # Count positive and negative keywords
        positive_count = sum(1 for kw in self.keywords_positive if kw in description_lower)
        negative_count = sum(1 for kw in self.keywords_negative if kw in description_lower)
        
        # Extract features
        features = []
        for keyword in self.keywords_positive:
            if keyword in description_lower:
                features.append(keyword.title())
        
        sentiment = 'positive' if positive_count > negative_count else 'neutral'
        if negative_count > positive_count:
            sentiment = 'negative'
        
        return {
            'sentiment': sentiment,
            'positive_features': positive_count,
            'negative_features': negative_count,
            'key_features': features[:5],  # Top 5 features
            'quality_score': min(100, positive_count * 10)
        }
    
    def _analyze_price(self, property_obj):
        """Analyze if price is fair, high, or low"""
        from models import Property, db
        from sqlalchemy import func
        
        # Get comparable properties
        comparables = Property.query.filter(
            Property.city == property_obj.city,
            Property.property_type == property_obj.property_type,
            Property.is_active == True,
            Property.id != property_obj.id
        )
        
        # Filter by similar size if available
        if property_obj.surface_area:
            size_margin = property_obj.surface_area * 0.2  # 20% margin
            comparables = comparables.filter(
                Property.surface_area.between(
                    property_obj.surface_area - size_margin,
                    property_obj.surface_area + size_margin
                )
            )
        
        comparables = comparables.limit(20).all()
        
        if not comparables:
            return {
                'status': 'insufficient_data',
                'message': 'Not enough comparable properties for analysis'
            }
        
        avg_price = sum(p.price for p in comparables) / len(comparables)
        price_diff = ((property_obj.price - avg_price) / avg_price * 100)
        
        if price_diff < -10:
            status = 'below_market'
            message = f'Price is {abs(price_diff):.1f}% below market average'
            opportunity = 'Potential bargain - investigate condition'
        elif price_diff > 10:
            status = 'above_market'
            message = f'Price is {price_diff:.1f}% above market average'
            opportunity = 'May be overpriced or has premium features'
        else:
            status = 'fair'
            message = 'Price is in line with market average'
            opportunity = 'Fair market price'
        
        return {
            'status': status,
            'message': message,
            'opportunity': opportunity,
            'market_average': round(avg_price, 2),
            'price_difference_pct': round(price_diff, 2),
            'comparables_count': len(comparables)
        }
    
    def _analyze_location(self, property_obj):
        """Score the location based on various factors"""
        score = 50  # Base score
        factors = []
        
        # City scoring
        premium_cities = {
            'casablanca': 20,
            'rabat': 18,
            'marrakech': 15,
            'tanger': 12,
            'agadir': 10
        }
        
        city_lower = property_obj.city.lower()
        for city, points in premium_cities.items():
            if city in city_lower:
                score += points
                factors.append(f"{city.title()} is a major economic hub")
                break
        
        # Neighborhood scoring
        if property_obj.neighborhood:
            premium_areas = ['maarif', 'gauthier', 'anfa', 'agdal', 'hay riad', 'gueliz']
            neighborhood_lower = property_obj.neighborhood.lower()
            
            for area in premium_areas:
                if area in neighborhood_lower:
                    score += 15
                    factors.append(f"{property_obj.neighborhood} is a sought-after area")
                    break
        
        return {
            'score': min(score, 100),
            'factors': factors,
            'rating': 'Excellent' if score > 80 else 'Good' if score > 60 else 'Average'
        }
    
    def _analyze_market_position(self, property_obj):
        """Determine property's position in the market"""
        from models import Property
        
        # Get total properties in same city
        total_in_city = Property.query.filter(
            Property.city == property_obj.city,
            Property.is_active == True
        ).count()
        
        # Get properties cheaper than this one
        cheaper_count = Property.query.filter(
            Property.city == property_obj.city,
            Property.property_type == property_obj.property_type,
            Property.price < property_obj.price,
            Property.is_active == True
        ).count()
        
        if total_in_city > 0:
            percentile = (cheaper_count / total_in_city) * 100
        else:
            percentile = 50
        
        if percentile < 25:
            segment = 'Budget-friendly'
        elif percentile < 50:
            segment = 'Mid-range'
        elif percentile < 75:
            segment = 'Upper mid-range'
        else:
            segment = 'Premium'
        
        return {
            'segment': segment,
            'percentile': round(percentile, 1),
            'total_comparable': total_in_city
        }
    
    def _calculate_investment_score(self, property_obj):
        """Calculate overall investment score"""
        # Import rules engine for evaluation
        from engine.rules import RulesEngine
        
        rules_engine = RulesEngine()
        evaluation = rules_engine.evaluate_investment_potential(property_obj)
        
        return evaluation
    
    def _extract_pros_cons(self, property_obj):
        """Extract pros and cons from property data"""
        pros = []
        cons = []
        
        # Price analysis
        if property_obj.surface_area and property_obj.price:
            price_per_sqm = property_obj.price / property_obj.surface_area
            if price_per_sqm < 15000:
                pros.append(f"Affordable at {price_per_sqm:.0f} MAD/m²")
            elif price_per_sqm > 25000:
                cons.append(f"Premium pricing at {price_per_sqm:.0f} MAD/m²")
        
        # Size analysis
        if property_obj.surface_area:
            if property_obj.surface_area > 120:
                pros.append(f"Spacious with {property_obj.surface_area}m²")
            elif property_obj.surface_area < 50:
                cons.append("Compact size may limit resale market")
        
        # Bedrooms
        if property_obj.bedrooms:
            if property_obj.bedrooms >= 3:
                pros.append(f"{property_obj.bedrooms} bedrooms - family-friendly")
            elif property_obj.bedrooms == 1:
                cons.append("Limited to singles/couples market")
        
        # Recency
        if property_obj.created_at:
            days_old = (datetime.utcnow() - property_obj.created_at).days
            if days_old < 7:
                pros.append("Recently listed - fresh opportunity")
            elif days_old > 90:
                cons.append("Listed for extended period - may indicate issues")
        
        return {
            'pros': pros[:5],
            'cons': cons[:5]
        }
    
    def _find_similar_properties(self, property_obj):
        """Find similar properties for comparison"""
        from models import Property
        
        similar = Property.query.filter(
            Property.city == property_obj.city,
            Property.property_type == property_obj.property_type,
            Property.is_active == True,
            Property.id != property_obj.id
        )
        
        # Filter by similar price range (±20%)
        price_margin = property_obj.price * 0.2
        similar = similar.filter(
            Property.price.between(
                property_obj.price - price_margin,
                property_obj.price + price_margin
            )
        )
        
        similar = similar.limit(5).all()
        
        return [
            {
                'id': p.id,
                'title': p.title,
                'price': p.price,
                'surface_area': p.surface_area
            }
            for p in similar
        ]
    
    def _predict_market_movement(self, property_obj):
        """Predict market movement for this property type/location"""
        from engine.rules import RulesEngine
        
        rules_engine = RulesEngine()
        trend = rules_engine.price_trend_analysis(
            property_obj.city,
            property_obj.property_type
        )
        
        if trend['trend'] == 'increasing':
            prediction = 'Prices are rising - good time to buy before further increases'
        elif trend['trend'] == 'decreasing':
            prediction = 'Prices are falling - may want to wait or negotiate aggressively'
        else:
            prediction = 'Market is stable - standard negotiation applies'
        
        return {
            'trend': trend['trend'],
            'prediction': prediction,
            'confidence': 'Medium'  # Can be improved with ML
        }
