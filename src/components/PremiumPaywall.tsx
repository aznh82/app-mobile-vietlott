import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { colors } from '../theme';
import { usePremium } from '../context/PremiumContext';

interface PremiumPaywallProps {
  visible: boolean;
  onClose: () => void;
}

export default function PremiumPaywall({ visible, onClose }: PremiumPaywallProps) {
  const { purchaseMonthly, purchaseLifetime, restorePurchases } = usePremium();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>Nâng cấp Premium</Text>
          <Text style={styles.subtitle}>Trải nghiệm tốt nhất, không quảng cáo</Text>

          {/* Features */}
          <View style={styles.features}>
            <FeatureRow icon="✅" text="Không quảng cáo" />
            <FeatureRow icon="📊" text="Phân tích nâng cao" />
            <FeatureRow icon="🔔" text="Thông báo kỳ quay mới" />
            <FeatureRow icon="📤" text="Xuất báo cáo PDF" />
            <FeatureRow icon="🎯" text="Bộ số gợi ý nâng cao" />
          </View>

          {/* Pricing */}
          <TouchableOpacity style={styles.monthlyBtn} onPress={purchaseMonthly}>
            <Text style={styles.monthlyBtnText}>$1.99 / tháng</Text>
            <Text style={styles.monthlyBtnSub}>Hủy bất cứ lúc nào</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.lifetimeBtn} onPress={purchaseLifetime}>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>BEST VALUE</Text>
            </View>
            <Text style={styles.lifetimeBtnText}>$4.99 — Mua vĩnh viễn</Text>
            <Text style={styles.lifetimeBtnSub}>Trả 1 lần, dùng mãi mãi</Text>
          </TouchableOpacity>

          {/* Restore & Close */}
          <TouchableOpacity style={styles.restoreBtn} onPress={restorePurchases}>
            <Text style={styles.restoreText}>Khôi phục giao dịch</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Không, cảm ơn</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderCard,
  },
  crown: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.jackpotGold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
  },
  features: {
    width: '100%',
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 10,
    width: 24,
  },
  featureText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  monthlyBtn: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  monthlyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  monthlyBtnSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  lifetimeBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.jackpotGold,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeRow: {
    position: 'absolute',
    top: -10,
  },
  badge: {
    backgroundColor: colors.jackpotGold,
    color: '#111',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  lifetimeBtnText: {
    color: colors.jackpotGold,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  lifetimeBtnSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  restoreBtn: {
    marginBottom: 6,
  },
  restoreText: {
    color: colors.textSecondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  closeBtn: {
    paddingVertical: 8,
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
