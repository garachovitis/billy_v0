import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, FlatList } from 'react-native';


import NetInfo from '@react-native-community/netinfo';

NetInfo.fetch().then(state => {
  console.log('Is connected?', state.isConnected);
});


interface BillingData {
    id: number; // Added to use for category update
    service: string;
    data: string;
}

interface Category {
    id: number;
    name: string;
    emoji: string;
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

// Import the images directly as assets
const cosmoteLogo = require('@/assets/images/cosmote.png');
const deiLogo = require('@/assets/images/dei.png');
const deyapLogo = require('@/assets/images/deyap.png');

const BillingInfoScreen: React.FC = () => {
    const [billingInfo, setBillingInfo] = useState<BillingData[]>([]);
    const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({});
    const [currentMonthExpenses, setCurrentMonthExpenses] = useState<number>(0);
    const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
    const [selectedBill, setSelectedBill] = useState<BillingData | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        fetch('http://127.0.0.1:8082/billing-info')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(result => {
                if (result.status === 'success') {
                    setBillingInfo(result.data);
                    calculateCurrentMonthExpenses(result.data);
                } else {
                    Alert.alert('No billing info available');
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });

        // Fetch categories from the database
        fetch('http://127.0.0.1:8082/categories')
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    setCategories(result.data);
                }
            })
            .catch(error => console.error('Error fetching categories:', error));
    }, []);

    const calculateCurrentMonthExpenses = (data: BillingData[]) => {
        const currentMonth = (new Date().getMonth() + 2) % 12; // Use the next month and wrap around December to January
        let total = 0;

        data.forEach((item) => {
            const billData = JSON.parse(item.data);
            const dateParts = billData.dueDate?.split('/');

            if (dateParts && dateParts.length === 2) {
                const monthFromData = parseInt(dateParts[1], 10) - 1; // zero-based month

                if (monthFromData === currentMonth) {
                    const amount = parseFloat(billData.paymentAmount || billData.totalAmount || billData.balance);
                    total += isNaN(amount) ? 0 : amount;
                }
            }
        });

        setCurrentMonthExpenses(total);
    };

    const formatAmount = (amount: string) => parseFloat(amount);
    const formatConnection = (connection: string | undefined) => connection || "No data";
    const formatAddress = (address: string | undefined) => address || "No data";

    const toggleMonth = (monthIndex: number) => {
        setExpandedMonths((prevState) => ({
            ...prevState,
            [monthIndex]: !prevState[monthIndex],
        }));
    };

    const groupBillsByMonth = () => {
        const currentMonth = parseInt(new Date().getMonth().toString(), 10); // Ensure integer type for currentMonth
        const billsByMonth: Record<number, Array<JSX.Element>> = {};

        billingInfo.forEach((item, index) => {
            const billData = JSON.parse(item.data);
            const dateParts = billData.dueDate?.split('/');
            let month = currentMonth;

            if (dateParts && dateParts.length === 2) {
                const day = parseInt(dateParts[0], 10);
                const monthFromData = parseInt(dateParts[1], 10) - 1;

                const dueDate = new Date(new Date().getFullYear(), monthFromData, day);
                if (!isNaN(dueDate.getTime())) {
                    const dueMonth = dueDate.getMonth();
                    month = getPreviousMonth(dueMonth);
                }
            }

            if (!billsByMonth[month]) {
                billsByMonth[month] = [];
            }

            if (item.service === 'cosmote') {
                billsByMonth[month].push(<View key={`${item.service}-${index}`}>{displayCosmoteData(billData, item)}</View>);
            } else if (item.service === 'dei') {
                billsByMonth[month].push(<View key={`${item.service}-${index}`}>{displayDEIData(billData, item)}</View>);
            } else if (item.service === 'deyap') {
                billsByMonth[month].push(<View key={`${item.service}-${index}`}>{displayDeyapData(billData, item)}</View>);
            }
        });

        return billsByMonth;
    };

    const getPreviousMonth = (monthIndex: number) => {
        return monthIndex === 0 ? 11 : monthIndex - 1;
    };

    const displayDropdownMenu = (bill: BillingData) => (
        <View style={styles.dropdownContainer}>
            <TouchableOpacity onPress={() => handleShowCategories(bill)}>
                <Text style={styles.moreOptions}>⋮</Text>
            </TouchableOpacity>
        </View>
    );

    const handleShowCategories = (bill: BillingData) => {
        console.log('Selected bill:', bill); // Προσθέστε αυτή τη γραμμή για να δείτε αν περιέχει το id
        setSelectedBill(bill);
        setShowCategoryModal(true);
    };

    const handleCategorySelection = (categoryId: number) => {
        if (selectedBill) {
            console.log('Selected bill ID:', selectedBill.billingid); // Ελέγξτε εάν το ID είναι σωστό
    
            fetch('http://127.0.0.1:8082/update-billing-category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    billingid: selectedBill.billingid, // Βεβαιωθείτε ότι αυτό είναι το σωστό πεδίο
                    categoryid: categoryId,
                }),
            })
                .then(response => response.json())
                .then(result => {
                    console.log('Server response:', result);
    
                    if (result.status === 'success') {
                        console.log(`Category updated for billing ID: ${selectedBill.billingid} with category ID: ${categoryId}`);
                        Alert.alert('Category updated successfully!');
                    } else {
                        Alert.alert('Failed to update category');
                    }
                })
                .catch(error => {
                    console.error('Error updating category:', error);
                    Alert.alert('Error updating category');
                });
    
            setShowCategoryModal(false);
        }
    };
    const displayCosmoteData = (data: CosmoteData[], bill: BillingData) =>
        data.map((billData, index) => (
            <View key={index} style={styles.accountCard}>
                <View style={styles.accountHeaderBox}>
                    <Text style={styles.accountName}>{formatConnection(billData.connection)}</Text>
                </View>
                <Image source={cosmoteLogo} style={styles.accountLogo} />
                <View style={styles.billingInfo}>
                    <Text style={styles.accountAmount}>{parseFloat(billData.totalAmount).toFixed(2)}€</Text>
                    <Text style={styles.accountDueDate}>
                        {billData.dueDate && /^\d{2}$/.test(billData.dueDate.slice(-2)) ? " Λήξη: " + billData.dueDate.slice(-5) : billData.dueDate || 'No data'}
                    </Text>
                </View>
                {displayDropdownMenu(bill)}
                <View style={styles.accountButtons}>
                    <TouchableOpacity style={styles.btnPay}>
                        <Text style={styles.btnText}>Pay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnSchedule}>
                        <Text style={styles.btnText}>Schedule</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ));

    const displayDEIData = (data: DeiData, bill: BillingData) => (
        <View style={styles.accountCard}>
            <View style={styles.accountHeaderBox}>
                <Text style={styles.accountName}>{formatAddress(data.address)}</Text>
            </View>
            <Image source={deiLogo} style={styles.accountLogo} />
            <View style={styles.billingInfo}>
                <Text style={styles.accountAmount}>{formatAmount(data.paymentAmount)}€</Text>
                <Text style={styles.accountDueDate}>Λήξη: {data.dueDate || 'No data'}</Text>
            </View>
            {displayDropdownMenu(bill)}
            <View style={styles.accountButtons}>
                <TouchableOpacity style={styles.btnPay}>
                    <Text style={styles.btnText}>Pay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSchedule}>
                    <Text style={styles.btnText}>Schedule</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const displayDeyapData = (data: DeyapData, bill: BillingData) => (
        <View style={styles.accountCard}>
            <View style={styles.accountHeaderBox}>
                <Text style={styles.accountName}>{formatAddress(data.address)}</Text>
            </View>
            <Image source={deyapLogo} style={styles.accountLogo} />
            <View style={styles.billingInfo}>
                <Text style={styles.accountAmount}>{formatAmount(data.balance)}€</Text>
                <Text style={styles.accountDueDate}>Κατάσταση: {data.status || 'No data'}</Text>
            </View>
            {displayDropdownMenu(bill)}
            <View style={styles.accountButtons}>
                <TouchableOpacity style={styles.btnPay}>
                    <Text style={styles.btnText}>Pay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSchedule}>
                    <Text style={styles.btnText}>Schedule</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const billsByMonth = groupBillsByMonth();

    const monthNames = [
        'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
        'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος',
    ];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.progressSummaryWrapper}>
                <Text style={styles.summaryHeader}>Μηνιαία έξοδα: {currentMonthExpenses.toFixed(2)}€</Text>
                <View style={styles.progressBarWrapper}>
                    <Text style={styles.progressLabel}>Πληρωμένοι</Text>
                    <View style={styles.progressBar}>
                        <View style={styles.progressBarFilled} />
                        <Text style={styles.progressBarLabel}>3/4</Text>
                    </View>
                </View>
            </View>

            {Object.entries(billsByMonth).map(([monthIndex, bills]) => {
                const month = parseInt(monthIndex);
                const isExpanded = expandedMonths[month];
                return (
                    <View key={monthIndex} style={styles.categorySection}>
                        <TouchableOpacity onPress={() => toggleMonth(month)} style={styles.categoryHeaderContainer}>
                            <Text style={styles.categoryHeader}>{monthNames[month]}</Text>
                            <Text style={styles.arrow}>{isExpanded ? '▲' : '▼'}</Text>
                        </TouchableOpacity>
                        {isExpanded && <View style={styles.accountsContainer}>{bills}</View>}
                    </View>
                );
            })}

            <Modal visible={showCategoryModal} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Category</Text>
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item.categoryid.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleCategorySelection(item.categoryid)}
                                    style={styles.categoryItem}
                                >
                                    <Text>{item.emoji} {item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f0f0f0',
    },
    progressSummaryWrapper: {
        backgroundColor: '#FFFFFF',
        padding: 21,
        borderTopLeftRadius: 7,
        borderTopRightRadius: 7,
        borderBottomRightRadius: 29,
        borderBottomLeftRadius: 29,
        marginBottom: 26,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    summaryHeader: {
        alignSelf: 'center',
        fontSize: 22,
        color: '#333',
        fontWeight: 'bold',
    },
    progressBarWrapper: {
        marginTop: 16,
    },
    progressLabel: {
        alignItems: 'center',
        fontSize: 18,
        color: '#606060',
    },
    progressBar: {
        backgroundColor: '#f0f0f0',
        height: 20,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    progressBarFilled: {
        backgroundColor: '#37B7C3',
        height: '100%',
        width: '75%',
    },
    progressBarLabel: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -8 }],
        fontSize: 14,
        color: '#333',
    },
    categorySection: {
        marginBottom: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 13,
        padding: 10,
        alignItems: 'center',
        shadowOpacity: 0.1,
    },
    categoryHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 15,
    },
    categoryHeader: {
        fontSize: 20,
        color: '#333',
        padding: 15,
        borderRadius: 15,
    },
    arrow: {
        fontSize: 20,
        color: '#333',
    },
    accountsContainer: {
        marginTop: 10,
    },
    accountCard: {
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
    accountHeaderBox: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#fff',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
        elevation: 2,
        zIndex: 1,
    },
    accountLogo: {
        marginTop: 25,
        width: 60,
        height: 60,
        alignSelf: 'center',
        marginVertical: 10,
    },
    billingInfo: {
        alignItems: 'center',
        marginBottom: 15,
    },
    accountAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    accountDueDate: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
    },
    accountButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    btnPay: {
        backgroundColor: '#37B7C3',
        padding: 12,
        width: '48%',
        borderRadius: 20,
    },
    btnSchedule: {
        backgroundColor: '#071952',
        padding: 12,
        width: '48%',
        borderRadius: 20,
    },
    btnText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },
    accountName: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    dropdownContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 2,
    },
    moreOptions: {
        fontSize: 24,
        color: '#333',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
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
    categoryItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    closeButton: {
        backgroundColor: '#37B7C3',
        padding: 10,
        borderRadius: 10,
        alignSelf: 'center',
        marginTop: 10,
    },
    closeButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
    },
});

export default BillingInfoScreen;