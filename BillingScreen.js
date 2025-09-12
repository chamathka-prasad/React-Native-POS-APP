import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet, Text, View, Button, Alert, SafeAreaView, FlatList,
    Image, Modal, TextInput, TouchableOpacity, ActivityIndicator, Keyboard // Added Keyboard
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { getProductById, saveBill, decreaseProductQuantity } from './database'; // Import saveBill & decreaseProductQuantity
import { useIsFocused } from '@react-navigation/native'; // Import useIsFocused for potential resets

// --- Placeholder Image ---
const placeholderBillingImage = require('./assets/placeholder-image.png');
// --- End Placeholder Image ---

export default function BillingScreen({ navigation }) {
  // Permissions
  const [permission, requestPermission] = useCameraPermissions();

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentQty, setCurrentQty] = useState('');

  // Bill State
  const [billItems, setBillItems] = useState([]);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [discount, setDiscount] = useState(''); // State for discount input
  const [isSavingBill, setIsSavingBill] = useState(false); // Loading state for saving

  // Sound State
  const [sound, setSound] = useState();

  const isScreenFocused = useIsFocused(); // To potentially reset state if needed

  // --- Load Sound Effect ---
  useEffect(() => {
    let soundObject = null;
    async function loadSound() {
        console.log('Loading Sound');
        try {
            const { sound } = await Audio.Sound.createAsync(require('./assets/beep.mp3'));
            soundObject = sound;
            setSound(soundObject);
            console.log('Sound loaded successfully');
        } catch (error) {
            console.error("Failed to load sound:", error);
        }
    }
    loadSound();
    return () => { // Cleanup
      if (soundObject) {
        console.log('Unloading Sound');
        soundObject.unloadAsync();
      }
    };
  }, []);

  // --- Reset state when screen is unfocused (optional, prevents stale bill) ---
  //   useEffect(() => {
  //     if (!isScreenFocused) {
  //       setBillItems([]);
  //       setDiscount('');
  //     }
  //   }, [isScreenFocused]);

  // --- Calculate Totals ---
  const subtotal = useMemo(() => {
    return billItems.reduce((sum, item) => sum + item.itemTotal, 0);
  }, [billItems]);

  const parsedDiscount = useMemo(() => {
      const num = parseFloat(discount);
      return isNaN(num) || num < 0 ? 0 : num; // Default to 0 if invalid or negative
  }, [discount]);

  const finalTotal = useMemo(() => {
      const total = subtotal - parsedDiscount;
      return total < 0 ? 0 : total; // Prevent negative final total
  }, [subtotal, parsedDiscount]);


  // --- Play Sound Function ---
  const playScanSound = useCallback(async () => { // Use useCallback
      if (sound) {
          try {
              await sound.replayAsync();
              console.log('Played sound');
          } catch (error) {
              console.error("Error playing sound:", error);
          }
      } else {
          console.log("Sound object not loaded, cannot play sound.");
      }
  }, [sound]); // Dependency: sound object

  // --- Handle Barcode Scanning ---
  const handleBarCodeScanned = useCallback(async (scanningResult) => {
    if (isModalVisible || isLoadingProduct || isSavingBill) return; // Prevent scan if busy

    const scannedId = scanningResult.data;
    if (!scannedId) return;

    console.log(`Barcode scanned, ID: ${scannedId}`);
    setIsLoadingProduct(true);

    try {
        const product = await getProductById(scannedId);
        if (product) {
            console.log("Product found:", product.name);
            await playScanSound();
            setCurrentItem(product);
            setCurrentQty('');
            console.log('>>> Setting modal visible: true'); // *** DIAGNOSTIC LOG ***
            setIsModalVisible(true); // Show the quantity modal
        } else {
            console.log(`Product with ID ${scannedId} not found in DB.`);
            Alert.alert('Not Found', `Product with ID ${scannedId} not found.`);
        }
    } catch (error) {
        console.error("Error fetching product by ID:", error);
        Alert.alert('Database Error', 'Could not fetch product details.');
    } finally {
        setIsLoadingProduct(false);
    }
  }, [isModalVisible, isLoadingProduct, isSavingBill, playScanSound]); // Dependencies

  // --- Modal Actions ---
  const closeModal = () => {
      setIsModalVisible(false);
      setCurrentItem(null);
      setCurrentQty('');
  };

  const handleAddToBill = () => {
      if (!currentItem) return;
      const quantityString = currentQty.trim();
      const quantity = quantityString === '' ? 1 : parseInt(quantityString, 10);

      if (isNaN(quantity) || quantity <= 0) {
          Alert.alert('Invalid Quantity', 'Please enter a valid quantity greater than 0.');
          return;
      }
       // Check if sufficient stock exists BEFORE adding to bill
      if (currentItem.qty < quantity) {
          Alert.alert('Insufficient Stock', `Only ${currentItem.qty} units of ${currentItem.name || 'this product'} available.`);
          return;
      }


      setBillItems(prevItems => {
          const existingItemIndex = prevItems.findIndex(item => item.product.id === currentItem.id);
          const itemTotal = currentItem.price * quantity;

          if (existingItemIndex > -1) {
              const updatedItems = [...prevItems];
              const existingItem = updatedItems[existingItemIndex];
              // Check stock again for increasing quantity
              const newTotalQtyInBill = existingItem.qty + quantity;
              if (currentItem.qty < newTotalQtyInBill) {
                   Alert.alert('Insufficient Stock', `Cannot add ${quantity} more. Only ${currentItem.qty - existingItem.qty} additional units available.`);
                   return prevItems; // Return previous items without change
              }
              updatedItems[existingItemIndex] = {
                  ...existingItem,
                  qty: newTotalQtyInBill,
                  itemTotal: existingItem.itemTotal + itemTotal
              };
              return updatedItems;
          } else {
              // Add new item to the bill
              return [...prevItems, { product: currentItem, qty: quantity, itemTotal: itemTotal }];
          }
      });
      closeModal();
  };

  // --- Bill Item Quantity Adjustment ---
    const updateItemQuantity = (productId, change) => {
        setBillItems(prevItems => {
            const itemIndex = prevItems.findIndex(item => item.product.id === productId);
            if (itemIndex === -1) return prevItems;

            const updatedItems = [...prevItems];
            const itemToUpdate = { ...updatedItems[itemIndex] };
            const newQty = itemToUpdate.qty + change;

            // If increasing quantity, check stock
            if (change > 0) {
                 // We need the original product quantity from the DB here.
                 // This requires either storing the original qty in billItems
                 // or doing another DB fetch, which is inefficient.
                 // For simplicity NOW, we won't re-check stock on +/- buttons,
                 // assuming initial add checked it. A real POS needs better stock handling.
                 console.warn("Stock check on +/- not implemented in this simplified version.");
            }


            if (newQty <= 0) {
                // Remove item if quantity drops to 0 or less
                updatedItems.splice(itemIndex, 1);
            } else {
                // Update quantity and total
                itemToUpdate.qty = newQty;
                itemToUpdate.itemTotal = itemToUpdate.product.price * newQty;
                updatedItems[itemIndex] = itemToUpdate;
            }
            return updatedItems;
        });
    };

  // --- Handle Print Bill Action ---
  const handlePrintBill = async () => {
      if (billItems.length === 0) {
          Alert.alert("Empty Bill", "Cannot print an empty bill.");
          return;
      }

      setIsSavingBill(true);
      Keyboard.dismiss();

      const billData = {
          items: billItems,
          subtotal: subtotal,
          discount: parsedDiscount,
          finalTotal: finalTotal,
      };

      try {
          // 1. Save the bill to the database
          const savedBill = await saveBill(billData);
          console.log("Bill saved successfully with ID:", savedBill.bill_id);

          // *** 2. Decrease Product Quantities ***
          try {
              console.log("Decreasing product quantities...");
              for (const item of billData.items) {
                  await decreaseProductQuantity(item.product.id, item.qty);
              }
              console.log("Product quantities updated.");
          } catch (qtyError) {
              console.error("Error updating product quantities after saving bill:", qtyError);
              // Non-critical error? Maybe just log it or show a warning.
              Alert.alert("Warning", "Bill saved, but failed to update product quantities in stock.");
          }

          // 3. Simulate Printing
          console.log(`--- BILL PRINT SIMULATION (Bill ID: ${savedBill.bill_id}) ---`);
          billItems.forEach(item => {
              console.log(`${item.product.name || `ID: ${item.product.id}`} - Qty: ${item.qty} - Item Total: Rs. ${item.itemTotal.toFixed(2)}`);
          });
          console.log(`Subtotal: Rs. ${subtotal.toFixed(2)}`);
          console.log(`Discount: Rs. ${parsedDiscount.toFixed(2)}`);
          console.log(`FINAL TOTAL: Rs. ${finalTotal.toFixed(2)}`);
          console.log(`--- END BILL PRINT SIMULATION ---`);

          Alert.alert(
              'Bill Saved & Print Simulation',
              `Bill ID: ${savedBill.bill_id}\nTotal: Rs. ${finalTotal.toFixed(2)}\n\n(Simulating printout. Actual Bluetooth printing requires specific setup.)`
          );

          // 4. Clear the current bill state
          setBillItems([]);
          setDiscount('');

      } catch (error) {
          console.error("Failed to save bill:", error);
          Alert.alert("Error", "Failed to save the bill. Please try again.");
      } finally {
          setIsSavingBill(false);
      }
  };


  // --- Render Logic based on Permissions ---
  if (!permission) {
    return (
        <SafeAreaView style={stylesBilling.container}>
            <View style={stylesBilling.centeredMessage}>
                <Text style={stylesBilling.permissionText}>Requesting camera permission...</Text>
            </View>
        </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={stylesBilling.container}>
         <View style={stylesBilling.centeredMessage}>
            <Text style={stylesBilling.permissionText}>Camera permission is required to scan barcodes.</Text>
            {permission.canAskAgain && (
                <Button onPress={requestPermission} title="Grant Permission" />
            )}
            {!permission.canAskAgain && (
                <Text style={stylesBilling.permissionSubText}>Please enable camera permissions in your device settings.</Text>
            )}
            <View style={{marginTop: 20}}>
                <Button title="Go Back" onPress={() => navigation.goBack()} />
            </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- Render Main Billing Screen (Permissions Granted) ---
  console.log("--- Rendering BillingScreen --- isModalVisible:", isModalVisible);
  return (
    <SafeAreaView style={stylesBilling.safeArea}>
        <View style={stylesBilling.container}>
            {/* Top Half: Camera View */}
            <View style={stylesBilling.cameraContainer}>
                 {isLoadingProduct && (
                     <View style={stylesBilling.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                    </View>
                 )}
                <CameraView
                    style={stylesBilling.camera}
                    barcodeScannerEnabled={!isModalVisible && !isSavingBill} // Disable scanner when modal is open or saving
                    onBarcodeScanned={handleBarCodeScanned}
                />
                 <View style={stylesBilling.scanFocus}></View>
            </View>

            {/* Bottom Half: Billing Details */}
            <View style={stylesBilling.billingContainer}>
                <Text style={stylesBilling.billingTitle}>Current Bill</Text>
                <View style={stylesBilling.listContainer}>
                    {billItems.length === 0 ? (
                        <Text style={stylesBilling.emptyBillText}>Scan items to add them to the bill.</Text>
                    ) : (
                        <FlatList
                            data={billItems}
                            keyExtractor={(item) => item.product.id.toString()}
                            renderItem={({ item }) => (
                                <View style={stylesBilling.billItem}>
                                    <Image
                                        source={item.product.imageUri ? { uri: item.product.imageUri } : placeholderBillingImage}
                                        style={stylesBilling.billItemImage}
                                    />
                                    <View style={stylesBilling.billItemInfo}>
                                        <Text style={stylesBilling.billItemName} numberOfLines={1}>{item.product.name || `ID: ${item.product.id}`}</Text>
                                        {/* Updated Currency */}
                                        <Text style={stylesBilling.billItemPrice}>Rs. {item.product.price.toFixed(2)} x {item.qty}</Text>
                                    </View>
                                    <View style={stylesBilling.billItemQtyContainer}>
                                        <TouchableOpacity onPress={() => updateItemQuantity(item.product.id, -1)} style={stylesBilling.qtyButton}>
                                            <Text style={stylesBilling.qtyButtonText}>-</Text>
                                        </TouchableOpacity>
                                        <Text style={stylesBilling.billItemQtyText}>{item.qty}</Text>
                                        <TouchableOpacity onPress={() => updateItemQuantity(item.product.id, 1)} style={stylesBilling.qtyButton}>
                                            <Text style={stylesBilling.qtyButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                     {/* Updated Currency */}
                                    <Text style={stylesBilling.billItemTotal}>Rs. {item.itemTotal.toFixed(2)}</Text>
                                </View>
                            )}
                            ItemSeparatorComponent={() => <View style={stylesBilling.separator} />}
                        />
                    )}
                </View>

                 {/* Totals and Discount Section */}
                <View style={stylesBilling.summaryContainer}>
                    <View style={stylesBilling.summaryRow}>
                        <Text style={stylesBilling.summaryLabel}>Subtotal:</Text>
                        {/* Updated Currency */}
                        <Text style={stylesBilling.summaryValue}>Rs. {subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={stylesBilling.summaryRow}>
                        <Text style={stylesBilling.summaryLabel}>Discount:</Text>
                        <View style={stylesBilling.discountInputContainer}>
                             <Text style={stylesBilling.currencySymbol}>Rs.</Text>
                             <TextInput
                                style={stylesBilling.discountInput}
                                placeholder="0.00"
                                placeholderTextColor="#aaa"
                                keyboardType="decimal-pad"
                                value={discount}
                                onChangeText={setDiscount}
                                onBlur={() => { // Optional: Format on blur
                                    const num = parseFloat(discount);
                                    if (!isNaN(num) && num >= 0) {
                                        setDiscount(num.toFixed(2));
                                    } else if (discount !== '') {
                                        setDiscount(''); // Clear if invalid (but not empty)
                                    }
                                }}
                            />
                        </View>
                    </View>
                    <View style={[stylesBilling.summaryRow, stylesBilling.finalTotalRow]}>
                        <Text style={[stylesBilling.summaryLabel, stylesBilling.finalTotalLabel]}>Final Total:</Text>
                         {/* Updated Currency */}
                        <Text style={[stylesBilling.summaryValue, stylesBilling.finalTotalAmount]}>Rs. {finalTotal.toFixed(2)}</Text>
                    </View>
                </View>

                 {/* Print Bill Button */}
                 <TouchableOpacity
                    style={[stylesBilling.printBillButton, (billItems.length === 0 || isSavingBill) && stylesBilling.printBillButtonDisabled]}
                    onPress={handlePrintBill}
                    disabled={billItems.length === 0 || isSavingBill}
                 >
                    {isSavingBill ? (
                        <ActivityIndicator color="#fff" size="small"/>
                    ) : (
                        <Text style={stylesBilling.printBillButtonText}>Save & Print Bill</Text>
                    )}
                 </TouchableOpacity>
            </View>
        </View>

        {/* Quantity Modal */}
        <Modal
            animationType="fade"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={closeModal}
        >
            {isModalVisible && console.log("--- Rendering Modal Content ---")}
            <View style={stylesBilling.modalOverlay}>
                <View style={stylesBilling.modalContent}>
                    <Text style={stylesBilling.modalTitle}>Enter Quantity</Text>
                    {currentItem && (
                        <>
                            <Image
                                source={currentItem.imageUri ? { uri: currentItem.imageUri } : placeholderBillingImage}
                                style={stylesBilling.modalImage}
                            />
                            <Text style={stylesBilling.modalProductInfo}>
                                {currentItem.name || `ID: ${currentItem.id}`}
                            </Text>
                             {/* Updated Currency */}
                            <Text style={stylesBilling.modalPrice}>
                                Price: Rs. {currentItem.price.toFixed(2)}
                            </Text>
                        </>
                    )}

                    <TextInput
                        style={stylesBilling.modalInput}
                        placeholder="Quantity (Default: 1)"
                        placeholderTextColor="#aaa"
                        keyboardType="number-pad"
                        value={currentQty}
                        onChangeText={setCurrentQty}
                        autoFocus={true}
                    />

                    <View style={stylesBilling.modalButtonContainer}>
                        <TouchableOpacity
                            style={[stylesBilling.modalButton, stylesBilling.modalCancelButton]}
                            onPress={closeModal}
                        >
                            <Text style={stylesBilling.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                         <TouchableOpacity
                            style={[stylesBilling.modalButton, stylesBilling.modalAddButton]}
                            onPress={handleAddToBill}
                        >
                            <Text style={stylesBilling.modalButtonText}>Add to Bill</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

    </SafeAreaView>
  );
}

// --- Styles for Billing Screen ---
const stylesBilling = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  centeredMessage: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  cameraContainer: {
    height: '45%', // Adjust height percentage
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
   scanFocus: {
      position: 'absolute',
      width: '60%',
      height: '50%', // Adjusted focus box size
      borderColor: 'rgba(255, 255, 255, 0.6)',
      borderWidth: 2,
      borderRadius: 10,
  },
   loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
  },
  billingContainer: {
    flex: 1, // Takes remaining space
    backgroundColor: '#f8f9fa',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  billingTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5, // Reduced margin
      color: '#333',
      textAlign: 'center',
  },
  listContainer: { // Added container for list
      flex: 1, // Allow list to grow
      marginBottom: 5,
  },
  emptyBillText: {
      textAlign: 'center',
      marginTop: 30,
      fontSize: 16,
      color: '#6c757d',
      flex: 1,
      textAlignVertical: 'center',
  },
  billItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 5,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
  },
  billItemImage: {
      width: 35, // Smaller image
      height: 35,
      borderRadius: 4,
      marginRight: 10,
      backgroundColor: '#eee',
  },
  billItemInfo: {
      flex: 1,
      marginRight: 8,
  },
  billItemName: {
      fontSize: 13, // Slightly smaller
      fontWeight: 'bold',
  },
  billItemPrice: {
      fontSize: 11, // Slightly smaller
      color: '#555',
  },
  billItemQtyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 3,
  },
  qtyButton: {
      backgroundColor: '#e9ecef',
      paddingHorizontal: 8, // Smaller padding
      paddingVertical: 3, // Smaller padding
      borderRadius: 15,
      marginHorizontal: 4,
  },
  qtyButtonText: {
      fontSize: 14, // Smaller text
      fontWeight: 'bold',
      color: '#495057',
  },
  billItemQtyText: {
      fontSize: 13, // Smaller text
      fontWeight: 'bold',
      minWidth: 18, // Ensure space for number
      textAlign: 'center',
  },
  billItemTotal: {
      fontSize: 13,
      fontWeight: 'bold',
      minWidth: 70, // Adjusted width for Rs.
      textAlign: 'right',
  },
  separator: {
      height: 6, // Reduced separator height
  },
  summaryContainer: { // Container for totals and discount
      paddingVertical: 5,
      borderTopWidth: 1,
      borderTopColor: '#ddd',
      backgroundColor: '#f8f9fa',
  },
  summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
      paddingHorizontal: 5,
  },
  summaryLabel: {
      fontSize: 15,
      color: '#444',
      fontWeight: '500',
  },
  summaryValue: {
      fontSize: 15,
      color: '#000',
      fontWeight: '500',
  },
  discountInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      paddingHorizontal: 8,
      backgroundColor: '#fff',
      maxWidth: '40%', // Limit width
  },
  currencySymbol: {
      fontSize: 14,
      color: '#555',
      marginRight: 3,
  },
  discountInput: {
      fontSize: 14,
      paddingVertical: 4,
      minWidth: 60, // Ensure minimum width
      textAlign: 'right',
  },
  finalTotalRow: {
      marginTop: 5,
      paddingTop: 5,
      borderTopWidth: 1,
      borderTopColor: '#ccc',
  },
  finalTotalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
  },
  finalTotalAmount: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#28a745', // Green for total
  },
  printBillButton: {
      backgroundColor: '#007AFF', // Blue color
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8, // Space above button
  },
  printBillButtonDisabled: {
      backgroundColor: '#a0c7e4', // Lighter blue when disabled
  },
  printBillButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
  },
   permissionText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  permissionSubText: {
      fontSize: 14,
      color: '#6c757d',
      marginTop: 10,
      marginBottom: 20,
      textAlign: 'center',
      paddingHorizontal: 30,
  },
  // Modal Styles
  modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay
  },
  modalContent: {
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 25,
      width: '90%', // Wider modal
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
      color: '#333',
  },
  modalImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginBottom: 10,
      backgroundColor: '#eee',
  },
  modalProductInfo: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
      textAlign: 'center',
      marginBottom: 5,
  },
  modalPrice: {
      fontSize: 14,
      color: '#555',
      marginBottom: 20,
  },
  modalInput: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 12,
      width: '80%', // Slightly narrower input
      marginBottom: 25, // More space below input
      fontSize: 18, // Larger font for qty
      textAlign: 'center',
  },
  modalButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between', // Space out buttons
      width: '100%',
      marginTop: 10,
  },
  modalButton: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      flex: 1, // Make buttons take equal width
      alignItems: 'center',
      marginHorizontal: 5, // Add space between buttons
  },
  modalCancelButton: {
      backgroundColor: '#6c757d', // Grey
  },
  modalAddButton: {
      backgroundColor: '#28a745', // Green
  },
  modalButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
  },
});

