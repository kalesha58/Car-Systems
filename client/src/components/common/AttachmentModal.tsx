import React, { FC } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';

interface IAttachmentOption {
    id: string;
    label: string;
    icon: string;
    color: string;
    onPress: () => void;
}

interface IAttachmentModalProps {
    visible: boolean;
    onClose: () => void;
    options: IAttachmentOption[];
}

const AttachmentModal: FC<IAttachmentModalProps> = ({ visible, onClose, options }) => {
    const { colors, isDark } = useTheme();

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        container: {
            backgroundColor: isDark ? '#1f2c34' : '#ffffff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 16,
            paddingBottom: 32,
            paddingHorizontal: 16,
        },
        header: {
            width: 40,
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            alignSelf: 'center',
            marginBottom: 20,
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
        },
        optionContainer: {
            width: '25%',
            alignItems: 'center',
            marginBottom: 24,
        },
        iconContainer: {
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
        },
        label: {
            fontSize: RFValue(11),
            fontFamily: Fonts.Regular,
            color: colors.text,
            textAlign: 'center',
        },
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}>
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}>
                <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
                    <View style={styles.container}>
                        <View style={styles.header} />
                        <View style={styles.grid}>
                            {options.map(option => (
                                <View key={option.id} style={styles.optionContainer}>
                                    <TouchableOpacity
                                        style={[styles.iconContainer, { backgroundColor: option.color }]}
                                        onPress={() => {
                                            option.onPress();
                                            onClose();
                                        }}
                                        activeOpacity={0.7}>
                                        <Icon name={option.icon} size={RFValue(24)} color="#ffffff" />
                                    </TouchableOpacity>
                                    <CustomText style={styles.label}>{option.label}</CustomText>
                                </View>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

export default AttachmentModal;
