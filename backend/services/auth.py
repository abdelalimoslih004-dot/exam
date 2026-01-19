"""
Authentication Service
Handles user authentication and authorization
"""
from models import User, db
from flask_jwt_extended import create_access_token


class AuthService:
    """Service for user authentication"""
    
    @staticmethod
    def register_user(username, email, password, role='trader'):
        """Register a new user"""
        # Check if user exists
        if User.query.filter_by(username=username).first():
            return {'error': 'Username already exists'}, 400
        
        if User.query.filter_by(email=email).first():
            return {'error': 'Email already exists'}, 400
        
        # Create new user
        user = User(username=username, email=email, role=role)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Generate token
        access_token = create_access_token(identity=user.id)
        
        return {
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }, 201
    
    @staticmethod
    def login_user(username, password):
        """Login a user"""
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user or not user.check_password(password):
            return {'error': 'Invalid credentials'}, 401
        
        access_token = create_access_token(identity=user.id)
        
        return {
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }, 200