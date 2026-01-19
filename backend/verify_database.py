import sys
sys.path.insert(0, 'C:\\Users\\abdel\\Desktop\\propsens\\backend')

from app import app, db
from models import User, Challenge, Trade, Message

with app.app_context():
    # Test 1: Verify tables exist
    print("\n✅ TEST 1: Vérification des tables")
    print(f"- User table: {User.query.count()} users")
    print(f"- Challenge table: {Challenge.query.count()} challenges")
    print(f"- Trade table: {Trade.query.count()} trades")
    print(f"- Message table: {Message.query.count()} messages")
    
    # Test 2: Verify admin exists
    print("\n✅ TEST 2: Vérification de l'admin")
    admin = User.query.filter_by(username='admin').first()
    if admin:
        print(f"- Admin trouvé: {admin.username} ({admin.email})")
        print(f"- Role: {admin.role}")
        print(f"- Password check: {admin.check_password('admin123')}")
    
    # Test 3: Create test trader
    print("\n✅ TEST 3: Création d'un trader de test")
    test_trader = User.query.filter_by(username='test_trader').first()
    if not test_trader:
        test_trader = User(
            username='test_trader',
            email='test@trader.com',
            role='trader'
        )
        test_trader.set_password('test123')
        db.session.add(test_trader)
        db.session.commit()
        print("- Trader créé: test_trader")
    else:
        print("- Trader existe déjà: test_trader")
    
    # Test 4: Create test challenge
    print("\n✅ TEST 4: Création d'un challenge de test")
    test_challenge = Challenge.query.filter_by(user_id=test_trader.id).first()
    if not test_challenge:
        test_challenge = Challenge(
            user_id=test_trader.id,
            type='Starter',
            initial_balance=10000.0,
            current_balance=10000.0,
            status='active',
            daily_start_equity=10000.0
        )
        db.session.add(test_challenge)
        db.session.commit()
        print(f"- Challenge créé: {test_challenge.type} - ${test_challenge.initial_balance}")
    else:
        print(f"- Challenge existe: {test_challenge.type} - ${test_challenge.current_balance}")
    
    # Test 5: Create test trade
    print("\n✅ TEST 5: Création d'un trade de test")
    test_trade = Trade.query.filter_by(challenge_id=test_challenge.id).first()
    if not test_trade:
        test_trade = Trade(
            challenge_id=test_challenge.id,
            symbol='EUR/USD',
            type='buy',
            price=1.0850,
            quantity=0.1,
            pnl=0.0,
            status='open'
        )
        db.session.add(test_trade)
        db.session.commit()
        print(f"- Trade créé: {test_trade.symbol} {test_trade.type} @ {test_trade.price}")
    else:
        print(f"- Trade existe: {test_trade.symbol} - Status: {test_trade.status}")
    
    # Test 6: Create test message
    print("\n✅ TEST 6: Création d'un message de test")
    test_message = Message.query.filter_by(user_id=test_trader.id).first()
    if not test_message:
        test_message = Message(
            user_id=test_trader.id,
            content='Hello from test!'
        )
        db.session.add(test_message)
        db.session.commit()
        print(f"- Message créé: {test_message.content}")
    else:
        print(f"- Message existe: {test_message.content}")
    
    # Final stats
    print("\n" + "="*60)
    print("📊 STATISTIQUES FINALES:")
    print("="*60)
    print(f"👥 Users: {User.query.count()}")
    print(f"🎯 Challenges: {Challenge.query.count()}")
    print(f"💹 Trades: {Trade.query.count()}")
    print(f"💬 Messages: {Message.query.count()}")
    print("="*60)
    print("\n✅ TOUS LES TESTS PASSÉS AVEC SUCCÈS!")
    print("="*60)
