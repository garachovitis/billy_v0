import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView, Image } from 'react-native';



interface Category {
    categoryid: number; // Διορθώθηκε για να ταιριάζει με τον πίνακα
    name: string;
    emoji: string;
}

interface BillingData {
    id: number;
    service: string;
    username: string;
    categories: number | null; // Πεδία όπως στην βάση δεδομένων
    data: string;
}

interface CosmoteData {
    connection: string;
    totalAmount: string;
    dueDate?: string;
}

interface DeiData {
    address: string;
    paymentAmount: string;
    dueDate?: string;
}

interface DeyapData {
    address: string;
    balance: string;
    status: string;
    dueDate?: string;
}

const cosmoteLogo = require('@/assets/images/cosmote.png');
const deiLogo = require('@/assets/images/dei.png');
const deyapLogo = require('@/assets/images/deyap.png');

const Categories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [billingInfo, setBillingInfo] = useState<BillingData[]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);

    useEffect(() => {
        fetch('http://127.0.0.1:8082/categories')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(result => {
                if (result.status === 'success') {
                    setCategories(result.data);
                    console.log('Categories fetched:', result.data);
                } else {
                    Alert.alert('No categories available');
                }
            })
            .catch(error => {
                console.error('Error fetching categories:', error);
                Alert.alert('Error fetching categories');
            });
    }, []);

    const fetchBillingInfo = (categoryId: number) => {
        console.log('Fetching billing info for categoryId:', categoryId);
        fetch(`http://127.0.0.1:8082/billing-info?categoryId=${categoryId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(result => {
                if (result.status === 'success') {
                    console.log('Billing info fetched:', result.data);
                    setBillingInfo(result.data.filter((bill: BillingData) => bill.categories === categoryId));
                } else {
                    Alert.alert('No billing info available for this category');
                    setBillingInfo([]);
                }
            })
            .catch(error => {
                console.error('Error fetching billing info:', error);
                Alert.alert('Error fetching billing info');
            });
    };

    const handleCategoryPress = (category: Category) => {
        console.log('Selected category:', category);
        setSelectedCategory(category);
        fetchBillingInfo(category.categoryid);
        setShowModal(true);
    };

    const displayBillingCard = (bill: BillingData) => {
        console.log('Displaying billing card for bill:', bill);
        const billData = JSON.parse(bill.data);
        const logo = bill.service === 'cosmote' ? cosmoteLogo : bill.service === 'dei' ? deiLogo : deyapLogo;

        return (
            <View key={bill.id} style={styles.billingCard}>
                <View style={styles.billingHeader}>
                    <Text style={styles.billingService}>{bill.service.toUpperCase()}</Text>
                    <Image source={logo} style={styles.billingLogo} />
                </View>
                <View style={styles.billingDetails}>
                    <Text style={styles.billingInfoText}>{bill.username}</Text>
                    <Text style={styles.billingInfoText}>
                         {parseFloat(billData.totalAmount || billData.paymentAmount || billData.balance).toFixed(2)}€
                    </Text>
                    <Text style={styles.billingInfoText}>Λήξη: {billData.dueDate || 'N/A'}</Text>
                </View>
                <View style={styles.billingButtons}>
                    <TouchableOpacity style={styles.btnPay}>
                        <Text style={styles.btnText}>Pay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSchedule}>
                        <Text style={styles.btnText}>Schedule</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {categories.map((category) => (
                <TouchableOpacity key={category.categoryid} style={styles.categoryBox} onPress={() => handleCategoryPress(category)}>
                    <Text style={styles.icon}>{category.emoji}</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
            ))}

            <Modal visible={showModal} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {selectedCategory ? `${selectedCategory.name}` : 'Λογαριασμοί'}
                        </Text>
                        <ScrollView>
                            {billingInfo.length > 0 ? (
                                billingInfo.map(displayBillingCard)
                            ) : (
                                <Text>Δεν βρέθηκαν λογαριασμοί για αυτήν την κατηγορία.</Text>
                            )}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingTop: 20,
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 10,
    },
    categoryBox: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 15,
        padding: 20,

        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    icon: {
        fontSize: 40,
        marginBottom: 10,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 15,
        textAlign: 'center',
    },
    billingCard: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 15,
        marginBottom: 10,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    billingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    billingService: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    billingLogo: {
        marginTop: 18,
        width: 60,
        height: 60,
        alignSelf: 'center',
        marginVertical: 10,
    },
    billingDetails: {
        marginBottom: 15,
    },
    billingInfoText: {
        fontSize: 16,
        marginBottom: 5,
    },
    billingButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    btnPay: {
        backgroundColor: '#37B7C3',
        padding: 12,
        borderRadius: 20,
        width: '48%',
    },
    btnSchedule: {
        backgroundColor: '#071952',
        padding: 12,
        borderRadius: 20,
        width: '48%',
    },
    btnText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },
    closeButton: {
        backgroundColor: '#D94C3D',
        padding: 10,
        width: '40%',
        borderRadius: 19,
        alignSelf: 'center',
        marginTop: 10,
    },
    closeButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },
});

export default Categories;