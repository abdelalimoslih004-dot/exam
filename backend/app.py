"""
Trading Challenge Platform - Main Backend Application
Flask + JWT Authentication + CORS + SocketIO
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import secrets
import time
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///trading.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
CORS(app, resources={r"/*": {"origins": "*"}})
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# JWT error handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"[JWT] Invalid token: {error}")
    return jsonify({'error': 'Invalid token', 'message': str(error)}), 422

@jwt.unauthorized_loader
def unauthorized_callback(error):
    print(f"[JWT] Unauthorized (missing token): {error}")
    return jsonify({'error': 'Authorization required', 'message': 'Missing Authorization header'}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print(f"[JWT] Expired token")
    return jsonify({'error': 'Token expired', 'message': 'The token has expired'}), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    print(f"[JWT] Revoked token")
    return jsonify({'error': 'Token revoked'}), 401

# Import and initialize database
from models import db, User, Challenge, Trade, Message

db.init_app(app)

# Import scrapers and services
from scrapers.live_feed import LiveFeedManager
from scrapers.bvc_scraper import BVCScraper
from services.news_service import NewsService
from engine.rules import killer

# Initialize services
live_feed = LiveFeedManager()
bvc_scraper = BVCScraper()
news_service = NewsService()
killer.init_app(app)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })


@app.route('/api/register', methods=['POST'])
def register():
    """User registration endpoint with automatic free challenge creation"""
    try:
        data = request.get_json()
        
        # Validate input
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'trader')  # Default to trader
        
        # Validate required fields
        if not username or not email or not password:
            return jsonify({'error': 'Username, email and password are required'}), 400
        
        # Validate role
        if role not in ['admin', 'trader', 'superadmin']:
            return jsonify({'error': 'Role must be trader, admin or superadmin'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user
        user = User(
            username=username,
            email=email,
            role=role
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.flush()  # Get user.id before creating challenge
        
        # 🎁 AUTO-CREATE FREE CHALLENGE FOR TRADERS
        challenge = None
        if role == 'trader':
            challenge = Challenge(
                user_id=user.id,
                type='Free Trial',
                initial_balance=5000.0,
                current_balance=5000.0,
                status='active',
                start_date=datetime.utcnow()
            )
            db.session.add(challenge)
            db.session.flush()
            
            # Initialize daily snapshot for challenge killer
            killer.daily_equity_snapshot[challenge.id] = challenge.initial_balance
        
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict(),
            'challenge': challenge.to_dict() if challenge else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[REGISTER ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/challenges/create-free', methods=['POST'])
@jwt_required()
def create_free_challenge():
    """
    Create a FREE challenge for users who don't have an active one
    Allows users to start trading without payment
    """
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user already has an active challenge
        active_challenge = Challenge.query.filter_by(
            user_id=user.id,
            status='active'
        ).first()
        
        if active_challenge:
            return jsonify({
                'error': 'You already have an active challenge',
                'challenge': active_challenge.to_dict()
            }), 400
        
        # Create new FREE challenge
        challenge = Challenge(
            user_id=user.id,
            type='Free Trial',
            initial_balance=5000.0,
            current_balance=5000.0,
            status='active',
            start_date=datetime.utcnow()
        )
        
        db.session.add(challenge)
        db.session.commit()
        
        # Initialize snapshot for challenge killer
        killer.daily_equity_snapshot[challenge.id] = challenge.initial_balance
        
        return jsonify({
            'message': 'Free challenge created successfully!',
            'challenge': challenge.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Create access token (identity must be string)
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users (Admin only)"""
    try:
        # Get current user
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user is admin
        if current_user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get all users
        users = User.query.all()
        
        return jsonify({
            'users': [user.to_dict() for user in users],
            'count': len(users)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/market-data', methods=['GET'])
def get_market_data():
    """
    Get comprehensive market data including:
    - Crypto prices (BTC, ETH) from yfinance
    - BVC stock data (IAM) from web scraping
    - Financial news with AI-generated summaries
    """
    try:
        # Get crypto prices
        crypto_data = live_feed.get_all_crypto_prices()
        
        # Get BVC stock data (IAM)
        bvc_data = bvc_scraper.get_all_bvc_data()
        
        # Get financial news with AI summaries
        news_data = news_service.get_summarized_news(limit=5)
        
        return jsonify({
            'crypto': crypto_data,
            'bvc': bvc_data,
            'news': news_data,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/crypto/<symbol>', methods=['GET'])
def get_crypto_price(symbol):
    """Get specific cryptocurrency price"""
    try:
        symbol = symbol.upper()
        
        if symbol == 'BTC':
            data = live_feed.get_btc_price()
        elif symbol == 'ETH':
            data = live_feed.get_eth_price()
        else:
            return jsonify({'error': 'Unsupported cryptocurrency'}), 400
        
        if data:
            return jsonify(data), 200
        else:
            return jsonify({'error': 'Failed to fetch price'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/bvc/iam', methods=['GET'])
def get_iam_stock():
    """Get IAM stock data from Casablanca Bourse (cached, update every 2 min)"""
    try:
        iam_data = bvc_scraper.get_cached_stock('IAM')
        return jsonify(iam_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ai/signal', methods=['POST', 'OPTIONS'])
def get_ai_signal():
    """
    TradeSense AI - Generate trading signal based on current price
    Uses simple momentum strategy with AI-style reasoning
    """
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        # Try to get user ID from JWT if provided
        try:
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            verify_jwt_in_request(optional=True)
            current_user_id = int(get_jwt_identity())
            print(f"[AI SIGNAL] Request from user ID: {current_user_id}")
        except Exception as jwt_error:
            print(f"[AI SIGNAL] No valid JWT, continuing without auth: {jwt_error}")
            current_user_id = None
        
        data = request.get_json()
        print(f"[AI SIGNAL] Request data: {data}")
        
        symbol = data.get('symbol', 'BTC')
        current_price = data.get('current_price')
        
        if not current_price:
            print("[AI SIGNAL] Error: current_price is required")
            return jsonify({'error': 'current_price is required'}), 400
        
        # Get historical data to calculate signal
        if symbol in ['BTC', 'ETH']:
            historical_data = live_feed.get_btc_price() if symbol == 'BTC' else live_feed.get_eth_price()
        else:
            historical_data = bvc_scraper.get_cached_stock(symbol)
        
        print(f"[AI SIGNAL] Historical data: {historical_data}")
        
        if not historical_data:
            print("[AI SIGNAL] Error: Failed to fetch market data")
            return jsonify({'error': 'Failed to fetch market data'}), 500
        
        # Simple momentum strategy
        price_change = historical_data.get('change_percent', 0)
        print(f"[AI SIGNAL] Price change: {price_change}%")
        
        # Generate signal based on momentum
        if price_change > 2:
            signal = 'BUY'
            confidence = min(95, 70 + abs(price_change) * 2)
            reasoning = f"📈 Forte tendance haussière (+{price_change:.2f}%). Momentum positif détecté. Bon point d'entrée pour une position longue."
            color = 'green'
        elif price_change < -2:
            signal = 'SELL'
            confidence = min(95, 70 + abs(price_change) * 2)
            reasoning = f"📉 Forte tendance baissière ({price_change:.2f}%). Momentum négatif détecté. Considérer une sortie ou position courte."
            color = 'red'
        elif price_change > 0:
            signal = 'BUY'
            confidence = 55 + abs(price_change) * 5
            reasoning = f"📊 Légère hausse (+{price_change:.2f}%). Tendance modérément positive. Opportunité d'achat conservatrice."
            color = 'green'
        elif price_change < 0:
            signal = 'HOLD'
            confidence = 60
            reasoning = f"⏸️ Légère baisse ({price_change:.2f}%). Marché incertain. Recommandé d'attendre une direction plus claire."
            color = 'yellow'
        else:
            signal = 'HOLD'
            confidence = 50
            reasoning = "⚖️ Prix stable. Aucune tendance claire. Attendre un signal plus fort avant d'agir."
            color = 'gray'
        
        result = {
            'signal': signal,
            'confidence': round(confidence, 1),
            'reasoning': reasoning,
            'color': color,
            'symbol': symbol,
            'current_price': current_price,
            'price_change': price_change,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        print(f"[AI SIGNAL] Success: {result}")
        return jsonify(result), 200
        
    except Exception as e:
        print(f"[AI SIGNAL] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/bvc/<symbol>', methods=['GET'])
def get_bvc_stock(symbol):
    """Get stock data from Casablanca Bourse (cached, update every 2 min)"""
    try:
        symbol = symbol.upper()
        
        if symbol not in bvc_scraper.stocks:
            return jsonify({'error': f'Unsupported stock symbol: {symbol}'}), 400
        
        stock_data = bvc_scraper.get_cached_stock(symbol)
        return jsonify(stock_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/bvc/all', methods=['GET'])
def get_all_bvc_stocks():
    """Get all supported Casablanca Bourse stocks (cached, update every 2 min)"""
    try:
        all_stocks = bvc_scraper.get_all_cached_stocks()
        return jsonify({
            'stocks': all_stocks,
            'count': len(all_stocks),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/news', methods=['GET'])
def get_news():
    """Get financial news with AI summaries"""
    try:
        limit = request.args.get('limit', default=5, type=int)
        keywords = request.args.get('keywords', default='financial markets crypto')
        
        news_data = news_service.get_summarized_news(keywords=keywords, limit=limit)
        return jsonify(news_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# DEMO HOOKS - Routes pour tests et démo
# ============================================

@app.route('/api/demo/quick-buy', methods=['POST'])
@jwt_required()
def demo_quick_buy():
    """
    Demo Hook: Crée un challenge actif de 5000 DH sans paiement
    Utile pour tester rapidement sans passer par un vrai paiement
    """
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Créer un nouveau challenge avec 5000 DH
        challenge = Challenge(
            user_id=user.id,
            type='Demo',
            initial_balance=5000.0,
            current_balance=5000.0,
            status='active',
            start_date=datetime.utcnow()
        )
        
        db.session.add(challenge)
        db.session.commit()
        
        # Initialiser le snapshot pour le killer
        killer.daily_equity_snapshot[challenge.id] = challenge.initial_balance
        
        return jsonify({
            'message': 'Challenge démo créé avec succès',
            'challenge': {
                'id': challenge.id,
                'type': challenge.type,
                'initial_balance': challenge.initial_balance,
                'current_balance': challenge.current_balance,
                'status': challenge.status,
                'start_date': challenge.start_date.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/demo/nuke', methods=['POST'])
@jwt_required()
def demo_nuke():
    """
    Demo Hook: Force une perte de 6% sur le challenge actif actuel
    Déclenche l'échec instantané du challenge (limite: 5% perte journalière)
    """
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Trouver le challenge actif de l'utilisateur
        challenge = Challenge.query.filter_by(
            user_id=user.id,
            status='active'
        ).first()
        
        if not challenge:
            return jsonify({'error': 'Aucun challenge actif trouvé'}), 404
        
        # Calculer perte de 6% sur le balance actuel
        loss_amount = challenge.current_balance * 0.06
        old_balance = challenge.current_balance
        challenge.current_balance -= loss_amount
        
        # Enregistrer une trade de perte (log complète)
        now_utc = datetime.utcnow()
        losing_trade = Trade(
            challenge_id=challenge.id,
            symbol='DEMO_NUKE',
            type='sell',
            price=0,
            quantity=0,
            pnl=-loss_amount,
            status='closed',
            opened_at=now_utc,
            closed_at=now_utc
        )
        
        db.session.add(losing_trade)
        db.session.commit()
        
        # Forcer la vérification du killer
        killer.check_challenge_now(challenge.id)
        
        # Recharger le challenge pour voir le nouveau status
        db.session.refresh(challenge)
        
        return jsonify({
            'message': 'Perte de 6% appliquée avec succès',
            'challenge': {
                'id': challenge.id,
                'old_balance': old_balance,
                'new_balance': challenge.current_balance,
                'loss_amount': loss_amount,
                'loss_percent': 6.0,
                'status': challenge.status,
                'is_failed': challenge.status == 'failed'
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/trades', methods=['POST'])
@jwt_required()
def record_trade():
    """
    Enregistre un trade et met à jour l'équité du challenge, puis applique
    immédiatement les règles du "Killer" (perte journalière, perte totale, profit target).

    Attendu dans le body JSON:
    {
      "challenge_id": optional (sinon on prend le challenge actif de l'utilisateur),
      "symbol": "BTCUSD",
      "side": "BUY" | "SELL",
      "entry_price": 50000.0,
      "exit_price": 50500.0,
      "quantity": 0.1
    }
    """
    try:
        data = request.get_json() or {}
        current_user_id = int(get_jwt_identity())

        symbol = data.get('symbol')
        side = (data.get('side') or '').upper()
        entry_price = data.get('entry_price')
        exit_price = data.get('exit_price')
        quantity = float(data.get('quantity') or 0)
        challenge_id = data.get('challenge_id')

        # Validations minimales
        if not symbol or side not in ['BUY', 'SELL']:
            return jsonify({'error': 'symbol et side (BUY/SELL) sont requis'}), 400
        if entry_price is None or exit_price is None:
            return jsonify({'error': 'entry_price et exit_price sont requis'}), 400
        if quantity <= 0:
            return jsonify({'error': 'quantity doit être > 0'}), 400

        # Récupérer le challenge ciblé (ou le challenge actif de l'utilisateur)
        challenge = None
        if challenge_id:
            challenge = Challenge.query.filter_by(id=challenge_id, status='active').first()
        else:
            challenge = Challenge.query.filter_by(user_id=current_user_id, status='active').first()

        if not challenge:
            return jsonify({'error': 'Aucun challenge actif trouvé'}), 404

        # Calcul P&L
        direction = 1 if side == 'BUY' else -1
        pnl = (exit_price - entry_price) * quantity * direction

        now_utc = datetime.utcnow()
        trade = Trade(
            challenge_id=challenge.id,
            symbol=symbol,
            type=side.lower(),
            price=exit_price,  # Kept for backward compatibility
            entry_price=entry_price,
            exit_price=exit_price,
            quantity=quantity,
            pnl=pnl,
            status='closed',
            opened_at=now_utc,
            closed_at=now_utc
        )

        challenge.current_balance = (challenge.current_balance or 0) + pnl

        db.session.add(trade)
        db.session.commit()

        # Initialiser le snapshot journalier si absent
        if challenge.id not in killer.daily_equity_snapshot:
            killer.daily_equity_snapshot[challenge.id] = challenge.current_balance

        # Vérifier les règles immédiatement
        killer.check_challenge_now(challenge.id)
        db.session.refresh(challenge)

        return jsonify({
            'message': 'Trade enregistré',
            'trade': trade.to_dict(),
            'challenge': challenge.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/demo/free-trial', methods=['POST'])
def demo_free_trial():
    """
    Création d'un compte démo + challenge actif sans paiement.
    Retourne le user, le token et le challenge pour naviguer directement au dashboard.
    """
    try:
        suffix = f"{int(time.time())}_{secrets.token_hex(2)}"
        username = f"demo_{suffix}"
        email = f"{username}@demo.local"
        password = secrets.token_hex(8)

        user = User(username=username, email=email, role='trader')
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        challenge = Challenge(
            user_id=user.id,
            type='Free Trial',
            initial_balance=5000.0,
            current_balance=5000.0,
            status='active',
            start_date=datetime.utcnow()
        )
        db.session.add(challenge)
        db.session.commit()

        # Initialiser snapshot pour la règle journalière
        killer.daily_equity_snapshot[challenge.id] = challenge.initial_balance

        access_token = create_access_token(identity=user.id)

        return jsonify({
            'message': 'Free trial created',
            'access_token': access_token,
            'user': user.to_dict(),
            'challenge': challenge.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/challenges', methods=['GET'])
@jwt_required()
def get_user_challenges():
    """Get all challenges for the current user"""
    try:
        current_user_id = int(get_jwt_identity())
        challenges = Challenge.query.filter_by(user_id=current_user_id).all()
        
        return jsonify({
            'challenges': [
                {
                    'id': c.id,
                    'type': c.type,
                    'initial_balance': c.initial_balance,
                    'current_balance': c.current_balance,
                    'status': c.status,
                    'start_date': c.start_date.isoformat() if c.start_date else None,
                    'end_date': c.end_date.isoformat() if c.end_date else None
                }
                for c in challenges
            ],
            'count': len(challenges)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/trades', methods=['GET'])
@jwt_required()
def get_user_trades():
    """Get all trades for the current user's active challenge"""
    try:
        current_user_id = int(get_jwt_identity())
        
        # Get user's active challenge
        challenge = Challenge.query.filter_by(user_id=current_user_id, status='active').first()
        
        if not challenge:
            return jsonify({'trades': [], 'message': 'No active challenge'}), 200
        
        # Get all trades for this challenge, ordered by most recent first
        trades = Trade.query.filter_by(challenge_id=challenge.id).order_by(Trade.closed_at.desc()).limit(50).all()
        
        return jsonify({
            'trades': [t.to_dict() for t in trades],
            'count': len(trades),
            'challenge_id': challenge.id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================
# LEADERBOARD ENDPOINT
# ============================================================
@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get top 10 traders by profit (PnL)"""
    try:
        # Calculate PnL for each user and order by profit
        top_traders = db.session.query(
            User.id,
            User.username,
            db.func.sum(Challenge.current_balance - Challenge.initial_balance).label('total_pnl'),
            db.func.count(Challenge.id).label('total_challenges'),
            db.func.sum(db.case((Challenge.status == 'PASSED', 1), else_=0)).label('passed_challenges')
        ).join(Challenge, Challenge.user_id == User.id)\
         .filter(User.role == 'trader')\
         .group_by(User.id, User.username)\
         .order_by(db.text('total_pnl DESC'))\
         .limit(10)\
         .all()
        
        leaderboard = []
        for rank, trader in enumerate(top_traders, start=1):
            leaderboard.append({
                'rank': rank,
                'user_id': trader.id,
                'username': trader.username,
                'total_pnl': float(trader.total_pnl or 0),
                'total_challenges': trader.total_challenges,
                'passed_challenges': trader.passed_challenges,
                'win_rate': round((trader.passed_challenges / trader.total_challenges * 100) if trader.total_challenges > 0 else 0, 2)
            })
        
        return jsonify({
            'leaderboard': leaderboard,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================
# ADMIN ENDPOINTS
# ============================================================
@app.route('/api/admin/challenges', methods=['GET'])
@jwt_required()
def admin_get_all_challenges():
    """Admin or SuperAdmin: Get all challenges with user info"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or user.role not in ['admin', 'superadmin']:
            return jsonify({'error': 'Admin access required'}), 403
        
        challenges = Challenge.query.join(User).all()
        
        return jsonify({
            'challenges': [
                {
                    'id': c.id,
                    'user_id': c.user_id,
                    'username': c.user.username,
                    'initial_balance': c.initial_balance,
                    'current_balance': c.current_balance,
                    'status': c.status,
                    'start_date': c.start_date.isoformat() if c.start_date else None,
                    'end_date': c.end_date.isoformat() if c.end_date else None,
                    'pnl': c.current_balance - c.initial_balance
                }
                for c in challenges
            ],
            'count': len(challenges)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/challenge/<int:challenge_id>/force-status', methods=['POST'])
@jwt_required()
def admin_force_challenge_status(challenge_id):
    """Admin or SuperAdmin: Force pass or fail a challenge"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or user.role not in ['admin', 'superadmin']:
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        new_status = data.get('status')  # 'PASSED' or 'FAILED'
        
        if new_status not in ['PASSED', 'FAILED']:
            return jsonify({'error': 'Status must be PASSED or FAILED'}), 400
        
        challenge = Challenge.query.get(challenge_id)
        if not challenge:
            return jsonify({'error': 'Challenge not found'}), 404
        
        old_status = challenge.status
        challenge.status = new_status
        challenge.end_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Challenge {challenge_id} status changed from {old_status} to {new_status}',
            'challenge': {
                'id': challenge.id,
                'user_id': challenge.user_id,
                'old_status': old_status,
                'new_status': new_status,
                'end_date': challenge.end_date.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================================
# SUPERADMIN ENDPOINTS - User Management
# ============================================================
@app.route('/api/superadmin/users', methods=['GET'])
@jwt_required()
def superadmin_get_all_users():
    """SuperAdmin only: Get all users"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'superadmin':
            return jsonify({'error': 'SuperAdmin access required'}), 403
        
        users = User.query.all()
        
        return jsonify({
            'users': [
                {
                    'id': u.id,
                    'username': u.username,
                    'email': u.email,
                    'role': u.role,
                    'created_at': u.created_at.isoformat() if u.created_at else None,
                    'challenges_count': u.challenges.count()
                }
                for u in users
            ],
            'count': len(users)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/user/<int:user_id>/role', methods=['POST'])
@jwt_required()
def superadmin_change_user_role(user_id):
    """SuperAdmin only: Change user role"""
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user or current_user.role != 'superadmin':
            return jsonify({'error': 'SuperAdmin access required'}), 403
        
        data = request.get_json()
        new_role = data.get('role')
        
        if new_role not in ['trader', 'admin', 'superadmin']:
            return jsonify({'error': 'Role must be trader, admin or superadmin'}), 400
        
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent superadmin from demoting themselves
        if target_user.id == current_user_id and new_role != 'superadmin':
            return jsonify({'error': 'Cannot demote yourself'}), 400
        
        old_role = target_user.role
        target_user.role = new_role
        
        db.session.commit()
        
        return jsonify({
            'message': f'User {target_user.username} role changed from {old_role} to {new_role}',
            'user': target_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/user/<int:user_id>/delete', methods=['DELETE'])
@jwt_required()
def superadmin_delete_user(user_id):
    """SuperAdmin only: Delete user and all their data"""
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user or current_user.role != 'superadmin':
            return jsonify({'error': 'SuperAdmin access required'}), 403
        
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Prevent superadmin from deleting themselves
        if target_user.id == current_user_id:
            return jsonify({'error': 'Cannot delete yourself'}), 400
        
        username = target_user.username
        db.session.delete(target_user)
        db.session.commit()
        
        return jsonify({
            'message': f'User {username} and all associated data deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/user/<int:user_id>/challenges', methods=['GET'])
@jwt_required()
def superadmin_get_user_challenges(user_id):
    """SuperAdmin only: Get all challenges for a specific user"""
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        if not current_user or current_user.role != 'superadmin':
            return jsonify({'error': 'SuperAdmin access required'}), 403
        
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        challenges = Challenge.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            'user': target_user.to_dict(),
            'challenges': [
                {
                    'id': c.id,
                    'type': c.type,
                    'initial_balance': c.initial_balance,
                    'current_balance': c.current_balance,
                    'status': c.status,
                    'pnl': c.current_balance - c.initial_balance,
                    'start_date': c.start_date.isoformat() if c.start_date else None,
                    'end_date': c.end_date.isoformat() if c.end_date else None
                }
                for c in challenges
            ],
            'count': len(challenges)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================
# SOCKETIO EVENTS FOR REAL-TIME CHAT
# ============================================================
@socketio.on('connect')
def handle_connect():
    """Client connected to WebSocket"""
    print(f'Client connected: {request.sid}')
    emit('message', {'type': 'system', 'content': 'Connected to PropSense chat'})


@socketio.on('disconnect')
def handle_disconnect():
    """Client disconnected from WebSocket"""
    print(f'Client disconnected: {request.sid}')


@socketio.on('join_chat')
def handle_join_chat(data):
    """User joins the global trading chat room"""
    username = data.get('username', 'Anonymous')
    join_room('trading_chat')
    print(f'{username} joined trading chat')
    emit('message', {
        'type': 'system',
        'content': f'{username} joined the chat',
        'timestamp': datetime.utcnow().isoformat()
    }, room='trading_chat')


@socketio.on('leave_chat')
def handle_leave_chat(data):
    """User leaves the trading chat room"""
    username = data.get('username', 'Anonymous')
    leave_room('trading_chat')
    print(f'{username} left trading chat')
    emit('message', {
        'type': 'system',
        'content': f'{username} left the chat',
        'timestamp': datetime.utcnow().isoformat()
    }, room='trading_chat')


@socketio.on('send_message')
def handle_send_message(data):
    """Broadcast message to all users in trading chat"""
    username = data.get('username', 'Anonymous')
    message = data.get('message', '')
    
    if message.strip():
        print(f'Message from {username}: {message}')
        emit('message', {
            'type': 'user',
            'username': username,
            'content': message,
            'timestamp': datetime.utcnow().isoformat()
        }, room='trading_chat')


# Database initialization
with app.app_context():
    db.create_all()
    print("[OK] Database tables created successfully")
    
    # Create default superadmin if doesn't exist
    superadmin = User.query.filter_by(username='superadmin').first()
    if not superadmin:
        superadmin = User(
            username='superadmin',
            email='superadmin@propsense.com',
            role='superadmin'
        )
        superadmin.set_password('superadmin123')
        db.session.add(superadmin)
        db.session.commit()
        print("[OK] Default superadmin user created (username: superadmin, password: superadmin123)")
    
    # Create default admin if doesn't exist
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@propsense.com',
            role='admin'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("[OK] Default admin user created (username: admin, password: admin123)")


if __name__ == '__main__':
    # Start live feed monitoring in background (crypto prices every 60 seconds)
    live_feed.start_monitoring()
    
    # Start BVC monitoring in background (stock prices every 2 minutes)
    bvc_scraper.start_monitoring(interval=120)  # 120 secondes = 2 minutes
    
    # Start Challenge Killer in background (check rules every 30 seconds)
    killer.start_monitoring(interval_seconds=30)
    
    print("[STARTUP] Server starting with market data monitoring...")
    print("[INFO] Crypto: update every 60 seconds")
    print("[INFO] BVC Stocks: update every 2 minutes")
    print("[INFO] Challenge Killer: check rules every 30 seconds")
    print("[INFO] Real-time chat enabled via SocketIO")
    
    socketio.run(
        app,
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=False
    )
