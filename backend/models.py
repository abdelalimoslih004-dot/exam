"""
Database Models - Trading Challenge Platform
SQLAlchemy ORM models for User, Challenge, Trade, and Message
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    """User account model"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='trader')  # admin or trader
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    challenges = db.relationship('Challenge', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    messages = db.relationship('Message', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set user password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Challenge(db.Model):
    """Trading challenge model"""
    __tablename__ = 'challenges'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    type = db.Column(db.String(20), nullable=False)  # Starter, Pro, Elite
    initial_balance = db.Column(db.Float, nullable=False)
    current_balance = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='active')  # active, failed, passed
    daily_start_equity = db.Column(db.Float)  # For tracking daily drawdown
    start_date = db.Column(db.DateTime)  # Challenge start date
    end_date = db.Column(db.DateTime)  # Challenge end date (when failed or passed)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    trades = db.relationship('Trade', backref='challenge', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert challenge to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'initial_balance': self.initial_balance,
            'current_balance': self.current_balance,
            'status': self.status,
            'daily_start_equity': self.daily_start_equity,
            'profit_loss': self.current_balance - self.initial_balance,
            'profit_loss_pct': ((self.current_balance - self.initial_balance) / self.initial_balance * 100) if self.initial_balance > 0 else 0,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Trade(db.Model):
    """Trade execution model"""
    __tablename__ = 'trades'
    
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id'), nullable=False, index=True)
    symbol = db.Column(db.String(20), nullable=False)  # e.g., EUR/USD, BTC/USD
    type = db.Column(db.String(10), nullable=False)  # buy or sell
    price = db.Column(db.Float, nullable=False)  # Exit price (kept for backward compatibility)
    entry_price = db.Column(db.Float)  # Entry price
    exit_price = db.Column(db.Float)  # Exit price
    quantity = db.Column(db.Float, nullable=False)  # Lot size or contract size
    pnl = db.Column(db.Float, default=0.0)  # Profit and Loss
    status = db.Column(db.String(10), nullable=False, default='open')  # open or closed
    opened_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        """Convert trade to dictionary"""
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'symbol': self.symbol,
            'type': self.type,
            'price': self.price,
            'entry_price': self.entry_price or self.price,
            'exit_price': self.exit_price or self.price,
            'quantity': self.quantity,
            'pnl': self.pnl,
            'status': self.status,
            'opened_at': self.opened_at.isoformat() if self.opened_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None
        }


class Message(db.Model):
    """Message/Chat model"""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """Convert message to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'content': self.content,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
