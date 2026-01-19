import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      landing: {
        title: "PropSense",
        subtitle: "Plateforme de Trading Prop Marocaine",
        description: "Testez vos compétences en trading avec de vrais fonds. Passez le challenge et gardez jusqu'à 80% des profits.",
        choosePlan: "Choisissez Votre Challenge",
        starter: "Starter",
        pro: "Pro",
        expert: "Expert",
        buyNow: "Acheter Maintenant",
        features: {
          capital: "Capital Initial",
          profit: "Part de Profit",
          dailyLoss: "Perte Journalière Max",
          totalLoss: "Perte Totale Max",
          target: "Objectif de Profit"
        },
        demo: "DÉMO - Achat Instantané"
      }
    }
  },
  en: {
    translation: {
      landing: {
        title: "PropSense",
        subtitle: "Moroccan Prop Trading Platform",
        description: "Test your trading skills with real funds. Pass the challenge and keep up to 80% of profits.",
        choosePlan: "Choose Your Challenge",
        starter: "Starter",
        pro: "Pro",
        expert: "Expert",
        buyNow: "Buy Now",
        features: {
          capital: "Initial Capital",
          profit: "Profit Share",
          dailyLoss: "Max Daily Loss",
          totalLoss: "Max Total Loss",
          target: "Profit Target"
        },
        demo: "DEMO - Instant Buy"
      }
    }
  },
  ar: {
    translation: {
      landing: {
        title: "بروب سينس",
        subtitle: "منصة التداول الاحترافي المغربية",
        description: "اختبر مهاراتك في التداول برأس مال حقيقي. انجح في التحدي واحتفظ بما يصل إلى 80٪ من الأرباح.",
        choosePlan: "اختر التحدي الخاص بك",
        starter: "المبتدئ",
        pro: "المحترف",
        expert: "الخبير",
        buyNow: "اشتر الآن",
        features: {
          capital: "رأس المال الأولي",
          profit: "نسبة الربح",
          dailyLoss: "أقصى خسارة يومية",
          totalLoss: "أقصى خسارة إجمالية",
          target: "هدف الربح"
        },
        demo: "تجريبي - شراء فوري"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
