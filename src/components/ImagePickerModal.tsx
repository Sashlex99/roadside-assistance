import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../constants/colors';

interface ImagePickerModalProps {
  visible: boolean;
  title: string;
  onCamera: () => void;
  onGallery: () => void;
  onCancel: () => void;
}

export default function ImagePickerModal({
  visible,
  title,
  onCamera,
  onGallery,
  onCancel
}: ImagePickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Как искате да добавите снимката?</Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.option, styles.cameraOption]}
              onPress={onCamera}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>📷</Text>
              </View>
              <Text style={styles.optionText}>Камера</Text>
              <Text style={styles.optionSubtext}>Направи нова снимка</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.option, styles.galleryOption]}
              onPress={onGallery}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🖼️</Text>
              </View>
              <Text style={styles.optionText}>Галерия</Text>
              <Text style={styles.optionSubtext}>Избери от телефона</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>Отказ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 30,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 5,
    borderWidth: 2,
  },
  cameraOption: {
    backgroundColor: `${colors.primary}10`,
    borderColor: colors.primary,
  },
  galleryOption: {
    backgroundColor: `${colors.success}10`,
    borderColor: colors.success,
  },
  iconContainer: {
    marginBottom: 10,
  },
  icon: {
    fontSize: 32,
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  optionSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
}); 