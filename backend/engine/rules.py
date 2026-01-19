"""
Trading Challenge Rules Engine - "Killer" System
Monitors active challenges and applies pass/fail rules automatically

Rules:
- FAILED: equity < daily_start_equity * 0.95 (5% daily loss)
- FAILED: equity < initial_balance * 0.90 (10% total drawdown)
- PASSED: equity > initial_balance * 1.10 (10% profit target)
"""
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from models import db, Challenge, Trade
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChallengeKiller:
    """
    Moteur de règles pour surveiller et terminer automatiquement les challenges
    selon les règles de profit/perte
    """
    
    def __init__(self, app=None):
        self.app = app
        self.scheduler = BackgroundScheduler()
        self.daily_equity_snapshot = {}  # {challenge_id: equity_at_day_start}
        
    def init_app(self, app):
        """Initialize with Flask app context"""
        self.app = app
        
    def start_monitoring(self, interval_seconds=30):
        """
        Démarre le monitoring automatique des challenges
        
        Args:
            interval_seconds: Fréquence de vérification (défaut: 30 secondes)
        """
        if self.scheduler.running:
            logger.warning("⚠️ Challenge Killer déjà actif")
            return
            
        logger.info(f"🎯 Démarrage Challenge Killer (vérification toutes les {interval_seconds}s)...")
        
        # Tâche principale: vérifier les règles
        self.scheduler.add_job(
            func=self._check_all_challenges,
            trigger='interval',
            seconds=interval_seconds,
            id='check_challenges',
            replace_existing=True
        )
        
        # Tâche quotidienne: prendre snapshot de l'équité à minuit
        self.scheduler.add_job(
            func=self._daily_equity_snapshot,
            trigger='cron',
            hour=0,
            minute=0,
            id='daily_snapshot',
            replace_existing=True
        )
        
        self.scheduler.start()
        logger.info("✅ Challenge Killer démarré")
        
    def stop_monitoring(self):
        """Arrête le monitoring"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("🛑 Challenge Killer arrêté")
    
    def _check_all_challenges(self):
        """Vérifie tous les challenges actifs et applique les règles"""
        if not self.app:
            logger.warning("⚠️ App context non disponible")
            return
            
        with self.app.app_context():
            try:
                # Récupérer tous les challenges actifs
                active_challenges = Challenge.query.filter_by(status='active').all()
                
                if not active_challenges:
                    return
                
                logger.info(f"🔍 Vérification de {len(active_challenges)} challenge(s) actif(s)...")
                
                for challenge in active_challenges:
                    self._check_challenge_rules(challenge)
                    
                db.session.commit()
                
            except Exception as e:
                logger.error(f"❌ Erreur lors de la vérification des challenges: {e}")
                db.session.rollback()
    
    def _check_challenge_rules(self, challenge):
        """
        Applique les règles de pass/fail sur un challenge
        
        Règles:
        1. FAILED si equity < daily_start_equity * 0.95 (perte journalière > 5%)
        2. FAILED si equity < initial_balance * 0.90 (drawdown total > 10%)
        3. PASSED si equity > initial_balance * 1.10 (profit > 10%)
        """
        current_equity = challenge.current_balance
        initial_balance = challenge.initial_balance
        
        # Règle 1: Vérifier perte journalière (5% max)
        daily_start = self.daily_equity_snapshot.get(challenge.id, initial_balance)
        daily_loss_threshold = daily_start * 0.95
        
        if current_equity < daily_loss_threshold:
            challenge.status = 'failed'
            challenge.end_date = datetime.utcnow()
            loss_percent = ((daily_start - current_equity) / daily_start) * 100
            logger.warning(
                f"❌ Challenge #{challenge.id} FAILED: Perte journalière de {loss_percent:.2f}% "
                f"(équité: {current_equity} < seuil: {daily_loss_threshold})"
            )
            return
        
        # Règle 2: Vérifier drawdown total (10% max)
        total_loss_threshold = initial_balance * 0.90
        
        if current_equity < total_loss_threshold:
            challenge.status = 'failed'
            challenge.end_date = datetime.utcnow()
            loss_percent = ((initial_balance - current_equity) / initial_balance) * 100
            logger.warning(
                f"❌ Challenge #{challenge.id} FAILED: Drawdown total de {loss_percent:.2f}% "
                f"(équité: {current_equity} < seuil: {total_loss_threshold})"
            )
            return
        
        # Règle 3: Vérifier objectif de profit (10%)
        profit_threshold = initial_balance * 1.10
        
        if current_equity >= profit_threshold:
            challenge.status = 'passed'
            challenge.end_date = datetime.utcnow()
            profit_percent = ((current_equity - initial_balance) / initial_balance) * 100
            logger.info(
                f"✅ Challenge #{challenge.id} PASSED: Profit de {profit_percent:.2f}% "
                f"(équité: {current_equity} >= objectif: {profit_threshold})"
            )
            return
    
    def _daily_equity_snapshot(self):
        """Prend un snapshot de l'équité de tous les challenges actifs à minuit"""
        if not self.app:
            return
            
        with self.app.app_context():
            try:
                active_challenges = Challenge.query.filter_by(status='active').all()
                
                for challenge in active_challenges:
                    self.daily_equity_snapshot[challenge.id] = challenge.current_balance
                
                logger.info(f"📸 Snapshot journalier: {len(active_challenges)} challenge(s)")
                
            except Exception as e:
                logger.error(f"❌ Erreur snapshot: {e}")
    
    def check_challenge_now(self, challenge_id):
        """
        Force la vérification immédiate d'un challenge spécifique
        Utile pour les tests et demo hooks
        """
        if not self.app:
            raise Exception("App context non disponible")
            
        with self.app.app_context():
            challenge = Challenge.query.get(challenge_id)
            if not challenge:
                raise Exception(f"Challenge #{challenge_id} introuvable")
            
            if challenge.status != 'active':
                raise Exception(f"Challenge #{challenge_id} n'est pas actif (status: {challenge.status})")
            
            # Initialiser le snapshot journalier si inexistant
            if challenge.id not in self.daily_equity_snapshot:
                self.daily_equity_snapshot[challenge.id] = challenge.initial_balance
            
            self._check_challenge_rules(challenge)
            db.session.commit()
            
            return challenge


# Instance globale du killer
killer = ChallengeKiller()
