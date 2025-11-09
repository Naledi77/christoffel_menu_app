import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
  Pressable,
  ListRenderItem,
  GestureResponderEvent,
  Platform, 
} from 'react-native';

// --- Type Definitions ---

/** Defines the structure for a menu item */
interface MenuItem {
  id: string;
  name: string;
  course: string;
  addOn: string;
  price: number;
}

/** Defines the custom navigation object used throughout the app */
interface SimpleNavigation {
  navigate: (name: ScreenName, params?: { item?: MenuItem }) => void;
  goBack: () => void;
  popToTop: () => void;
}

/** Defines the route object passed to screens */
interface RouteProps {
  route: {
    params: {
      item?: MenuItem;
    };
  };
}

/** All possible screen names */
type ScreenName = 'Home' | 'Chef' | 'GuestFilter' | 'SelectedCourse' | 'Payment' | 'Unknown';

/** Defines the structure for a screen component */
interface ScreenProps extends Partial<RouteProps> {
  navigation: SimpleNavigation;
  // Specific props for AddMenuItemScreen/ChefScreen
  addItem?: (item: MenuItem) => void;
  removeItem?: (id: string) => void;
  menuItems?: MenuItem[];
}

// --- Data ---
const COURSES: string[] = ['Starter', 'Main', 'Dessert', 'Beverage'];
const ADDONS: string[] = ['Extra Sauce', 'Salad', 'Fries', 'None'];

// --- Utility Components ---

interface CustomButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  style?: object;
  textStyle?: object;
}

/** Reusable Button component */
function CustomButton({ title, onPress, style, textStyle }: CustomButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

interface MenuCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

/** Simple Card component for menu items */
function MenuCard({ item, onSelect }: MenuCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onSelect(item)}>
      <View style={styles.cardContent}>
        <View style={styles.thumbnailPlaceholder} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>
            {item.course} • {item.addOn || 'No add-ons'}
          </Text>
          <Text style={styles.cardPrice}>R {item.price.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface SimpleSelectProps {
  label: string;
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * SimpleSelect implemented as a class component
 */
class SimpleSelect extends React.Component<SimpleSelectProps, { open: boolean }> {
  constructor(props: SimpleSelectProps) {
    super(props);
    this.state = { open: false };
  }

  open = () => this.setState({ open: true });
  close = () => this.setState({ open: false });

  render() {
    const { label, options, value, onValueChange } = this.props;
    const { open } = this.state;

    return (
      <View style={{ marginTop: 6 }}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.pickerWrapper} onPress={this.open}>
          <View style={{ padding: 12 }}>
            <Text>{value}</Text>
          </View>
        </TouchableOpacity>

        <Modal visible={open} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>{label}</Text>
              <FlatList
                data={options}
                keyExtractor={(item) => item}
                renderItem={({ item }: { item: string }) => (
                  <Pressable
                    onPress={() => {
                      onValueChange && onValueChange(item);
                      this.close();
                    }}
                    style={({ pressed }) => [styles.optionRow, pressed && { opacity: 0.6 }]}
                  >
                    <Text style={{ fontSize: 16 }}>{item}</Text>
                  </Pressable>
                )}
              />

              <View style={{ height: 12 }} />
              <CustomButton title="Close" onPress={this.close} style={{ backgroundColor: '#aaa' }} />
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

// --- Screens ---

function HomeScreen({ navigation, menuItems }: ScreenProps) {
  const [filter, setFilter] = useState<string>('All');

  // Compute averages per course
  function computeAverages(items: MenuItem[] = []) {
    const result: { course: string; average: number; count: number }[] = [];
    COURSES.forEach((c) => {
      const list = items.filter((it) => it.course === c);
      const count = list.length;
      const average = count > 0 ? list.reduce((s, i) => s + i.price, 0) / count : 0;
      result.push({ course: c, average: parseFloat(average.toFixed(2)), count });
    });
    return result;
  }

  // overall average for all menu items
  function overallAverage(items: MenuItem[] = []) {
    if (!items || items.length === 0) return 0;
    const sum = items.reduce((s, i) => s + i.price, 0);
    return parseFloat((sum / items.length).toFixed(2));
  }

  const averages = computeAverages(menuItems || []);
  const overall = overallAverage(menuItems || []);
  const totalCount = (menuItems || []).length;

  // filtered list according to selected filter
  const displayed = filter === 'All' ? menuItems || [] : (menuItems || []).filter((it) => it.course === filter);

  const renderItem: ListRenderItem<MenuItem> = ({ item }) => (
    <MenuCard item={item} onSelect={(it) => navigation.navigate('SelectedCourse', { item: it })} />
  );

  const options = ['All', ...COURSES];

  return (
    // SafeAreaView is correctly used here
    <SafeAreaView style={styles.container}>
      {/* Header separated from ScrollView to prevent scrolling over it */}
      <View style={styles.header}>
        <Text style={styles.logo}>Christoffel Menu</Text>
        <Text style={styles.welcome}>Welcome! Manage your chef menus easily.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>Menu Overview</Text>
          <Text style={{ color: '#666' }}>Total items: <Text style={{ fontWeight: '700', color: '#333' }}>{totalCount}</Text></Text>
        </View>

        <View style={{ height: 12 }} />

        <Text style={{ fontWeight: '700', marginBottom: 6 }}>Course filter</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
          {options.map((o) => (
            <TouchableOpacity
              key={o}
              onPress={() => setFilter(o)}
              style={[
                { padding: 8, borderRadius: 8, marginRight: 8, marginBottom: 8 },
                filter === o ? styles.tabButtonActive : { borderWidth: 1, borderColor: '#eee' },
              ]}
            >
              <Text style={filter === o ? styles.tabActiveText : styles.tabText}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Average price</Text>
        <View style={{ height: 8 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
          <Text style={{ fontWeight: '700' }}>Overall average</Text>
          <Text style={{ color: '#4A90E2', fontWeight: '700' }}>R {overall.toFixed(2)}</Text>
        </View>

        <View style={{ height: 8 }} />
        {averages.map((a) => (
          <View key={a.course} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ fontWeight: '700' }}>
              {a.course} {a.count > 0 ? `(${a.count})` : '(0)'}
            </Text>
            <Text style={{ color: '#4A90E2', fontWeight: '700' }}>R {a.average.toFixed(2)}</Text>
          </View>
        ))}

        <View style={{ height: 18 }} />
        <Text style={styles.sectionTitle}>Menu ({filter})</Text>
        <View style={{ height: 8 }} />
        {displayed && displayed.length > 0 ? (
          // Use nested FlatList with caution; ScrollView is OK here since it's inside
          <FlatList 
            data={displayed} 
            keyExtractor={(i) => i.id} 
            renderItem={renderItem} 
            scrollEnabled={false} // Disable inner scrolling to allow parent ScrollView to handle it
          />
        ) : (
          <Text style={{ color: '#666' }}>No menu items for this filter.</Text>
        )}

        <View style={{ height: 24 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <CustomButton
            title="Chef: Add / Remove"
            onPress={() => navigation.navigate('Chef')}
            style={{ flex: 1, marginRight: 8 }}
          />
          <CustomButton
            title="Guest: Filter"
            onPress={() => navigation.navigate('GuestFilter')}
            style={{ flex: 1, marginLeft: 8, backgroundColor: '#6cc070' }}
          />
        </View>

        <View style={{ height: 40 }} />
        <View style={styles.bottomNote}>
          <Text style={{ color: '#666' }}>Home shows the complete menu, totals, filters, and averages.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Form + list used by Chef to add and remove items */
function ChefScreen({ navigation, addItem, removeItem, menuItems }: ScreenProps) {
  const [name, setName] = useState<string>('');
  const [course, setCourse] = useState<string>(COURSES[0]);
  const [addOn, setAddOn] = useState<string>(ADDONS[0]);
  const [price, setPrice] = useState<string>('');

  function onAdd() {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Validation', 'Please enter a dish name and price.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert('Validation', 'Please enter a valid price.');
      return;
    }

    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: name.trim(),
      course,
      addOn: addOn === 'None' ? '' : addOn,
      price: parseFloat(parsedPrice.toFixed(2)),
    };

    addItem && addItem(newItem);

    // Reset form
    setName('');
    setPrice('');
    setAddOn(ADDONS[0]);
    setCourse(COURSES[0]);

    // Show success and navigate back to Home so user immediately sees the new item on Home
    Alert.alert('Success', 'Menu item added.', [
      {
        text: 'OK',
        onPress: () => {
          navigation.popToTop();
        },
      },
    ]);
  }

  function confirmRemove(id: string, itemName: string) {
    Alert.alert('Remove item', `Remove "${itemName}" from the menu?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeItem && removeItem(id);
        },
      },
    ]);
  }

  const renderItem: ListRenderItem<MenuItem> = ({ item }) => (
    <View style={[styles.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
      <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('SelectedCourse', { item })}>
        <View style={styles.cardContent}>
          <View style={styles.thumbnailPlaceholder} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>
              {item.course} • {item.addOn || 'No add-ons'}
            </Text>
            <Text style={styles.cardPrice}>R {item.price.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => confirmRemove(item.id, item.name)}
        style={{ padding: 8, marginLeft: 8, backgroundColor: '#ffdede', borderRadius: 8 }}
      >
        <Text style={{ color: '#900', fontWeight: '700' }}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.sectionTitle}>Chef — Add a Menu Item</Text>

        <Text style={styles.label}>Dish name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Grilled Chicken" style={styles.input} />

        <SimpleSelect label="Course" options={COURSES} value={course} onValueChange={setCourse} />

        <SimpleSelect label="Add-on" options={ADDONS} value={addOn} onValueChange={setAddOn} />

        <Text style={styles.label}>Price (ZAR)</Text>
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 120.00"
          keyboardType="numeric"
          style={styles.input}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
          <CustomButton title="Add" onPress={onAdd} style={{ flex: 1, marginRight: 8 }} />
          <CustomButton
            title="Clear"
            onPress={() => {
              setName('');
              setPrice('');
              setAddOn(ADDONS[0]);
              setCourse(COURSES[0]);
            }}
            style={{ flex: 1, marginLeft: 8, backgroundColor: '#aaa' }}
          />
        </View>

        <View style={{ height: 30 }} />

        <Text style={styles.sectionTitle}>Current Menu</Text>
        <View style={{ height: 8 }} />
        {menuItems && menuItems.length > 0 ? (
          // Use nested FlatList with caution; ScrollView is OK here since it's inside
          <FlatList 
            data={menuItems} 
            keyExtractor={(i) => i.id} 
            renderItem={renderItem} 
            scrollEnabled={false} // Disable inner scrolling to allow parent ScrollView to handle it
          />
        ) : (
          <Text style={{ color: '#666' }}>No menu items yet.</Text>
        )}

        <View style={{ height: 20 }} />
        <CustomButton title="Back to Home" onPress={() => navigation.popToTop()} style={{ backgroundColor: '#eee' }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function GuestFilterScreen({ navigation, menuItems }: ScreenProps) {
  const [filter, setFilter] = useState<string>('All');

  const options = ['All', ...COURSES];

  const filtered = filter === 'All' ? menuItems || [] : (menuItems || []).filter((it) => it.course === filter);

  const renderItem: ListRenderItem<MenuItem> = ({ item }) => (
    <MenuCard item={item} onSelect={(it) => navigation.navigate('SelectedCourse', { item: it })} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.sectionTitle}>Guest — Filter by course</Text>
        <View style={{ height: 8 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {options.map((o) => (
            <TouchableOpacity
              key={o}
              onPress={() => setFilter(o)}
              style={[
                { padding: 8, borderRadius: 8, marginRight: 8, marginBottom: 8 },
                filter === o ? styles.tabButtonActive : { borderWidth: 1, borderColor: '#eee' },
              ]}
            >
              <Text style={filter === o ? styles.tabActiveText : styles.tabText}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 12 }} />
        {filtered.length > 0 ? (
          // Use nested FlatList with caution; ScrollView is OK here since it's inside
          <FlatList 
            data={filtered} 
            keyExtractor={(i) => i.id} 
            renderItem={renderItem} 
            scrollEnabled={false} // Disable inner scrolling to allow parent ScrollView to handle it
          />
        ) : (
          <Text style={{ color: '#666' }}>No menu items for this filter.</Text>
        )}

        <View style={{ height: 20 }} />
        <CustomButton title="Back to Home" onPress={() => navigation.popToTop()} style={{ backgroundColor: '#eee' }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SelectedCourseScreen({ navigation, route }: ScreenProps & RouteProps) {
  const item: MenuItem | undefined = route?.params?.item;

  if (!item)
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.scrollViewContent}>No item selected.</Text>
      </SafeAreaView>
    );

  function onConfirm() {
    navigation.navigate('Payment', { item });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.sectionTitle}>{item.name}</Text>
        <View style={{ height: 12 }} />
        <Text style={styles.label}>Course</Text>
        <Text style={styles.valueText}>{item.course}</Text>
        <Text style={styles.label}>Add-on</Text>
        <Text style={styles.valueText}>{item.addOn || 'None'}</Text>
        <Text style={styles.label}>Price</Text>
        <Text style={styles.priceLarge}>R {item.price.toFixed(2)}</Text>

        <View style={{ height: 24 }} />
        <CustomButton title="Confirm Meal" onPress={onConfirm} />
        <View style={{ height: 12 }} />
        <CustomButton title="Cancel" onPress={() => navigation.goBack()} style={{ backgroundColor: '#aaa' }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PaymentScreen({ navigation, route }: ScreenProps & RouteProps) {
  const item: MenuItem | undefined = route?.params?.item;
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');

  if (!item)
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.scrollViewContent}>Error: Missing item for payment.</Text>
      </SafeAreaView>
    );

  function onConfirmPayment() {
    if (!bankName.trim() || !accountNumber.trim()) {
      Alert.alert('Validation', 'Please fill payment details.');
      return;
    }
    Alert.alert('Payment confirmed', `Order for ${item!.name} placed. Total: R ${item!.price.toFixed(2)}`, [
      { text: 'OK', onPress: () => navigation.popToTop() },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.sectionTitle}>Payment for: {item.name}</Text>
        <Text style={{ marginTop: 8, color: '#666' }}>Total: R {item.price.toFixed(2)}</Text>

        <Text style={[styles.label, { marginTop: 16 }]}>Bank name</Text>
        <TextInput
          value={bankName}
          onChangeText={setBankName}
          placeholder="e.g. First National Bank"
          style={styles.input}
        />

        <Text style={styles.label}>Account number</Text>
        <TextInput
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder="e.g. 123456789"
          keyboardType="numeric"
          style={styles.input}
        />

        <View style={{ height: 20 }} />
        <CustomButton title="Confirm payment" onPress={onConfirmPayment} />

        <View style={{ height: 12 }} />
        <CustomButton title="Cancel" onPress={() => navigation.goBack()} style={{ backgroundColor: '#aaa' }} />

        <View style={{ height: 40 }} />
        <CustomButton
          title="Back to Home"
          onPress={() => navigation.popToTop()}
          style={{ backgroundColor: '#eee' }}
          textStyle={{ color: '#333' }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Simple custom navigation stack implementation ---

interface Route {
  name: ScreenName;
  params: {
    item?: MenuItem;
  };
}

function useSimpleStack(initialRoute: Route) {
  const [stack, setStack] = useState<Route[]>([initialRoute]);

  function navigate(name: ScreenName, params: { item?: MenuItem } = {}) {
    setStack((prev) => [...prev, { name, params }]);
  }
  function goBack() {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }
  function popToTop() {
    setStack((prev) => (prev.length ? [prev[0]] : prev));
  }

  const current = stack[stack.length - 1];

  return { stack, current, navigate, goBack, popToTop, setStack };
}

export default function App() {
  const { current, navigate, goBack, popToTop } = useSimpleStack({ name: 'Home', params: {} });

  // top-level menuItems array (shared across screens)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    // Example initial items included for testing purposes
    { id: '1', name: 'Tomato Soup', course: 'Starter', addOn: '', price: 45.0 },
    { id: '2', name: 'Grilled Steak', course: 'Main', addOn: 'Fries', price: 220.0 },
  ]);

  function addItem(item: MenuItem) {
    setMenuItems((prev) => [item, ...prev]);
  }

  function removeItem(id: string) {
    setMenuItems((prev) => prev.filter((i) => i.id !== id));
  }

  // navigation object passed to screens
  const navigation: SimpleNavigation = {
    navigate,
    goBack,
    popToTop,
  };

  const route: RouteProps['route'] = { params: current.params };

  // map route names to components
  function renderScreen() {
    const name: ScreenName = current.name;
    if (name === 'Home') return <HomeScreen navigation={navigation} menuItems={menuItems} />;
    if (name === 'Chef')
      return <ChefScreen navigation={navigation} addItem={addItem} removeItem={removeItem} menuItems={menuItems} />;
    if (name === 'GuestFilter') return <GuestFilterScreen navigation={navigation} menuItems={menuItems} />;
    if (name === 'SelectedCourse') return <SelectedCourseScreen navigation={navigation} route={route} />;
    if (name === 'Payment') return <PaymentScreen navigation={navigation} route={route} />;
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.scrollViewContent}>Unknown screen: {name}</Text>
      </SafeAreaView>
    );
  }

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
}

// --- Stylesheet ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  // Added a specific content style for ScrollViews to replace duplicated inline padding
  scrollViewContent: { padding: 16, paddingBottom: 40 }, 
  // Removed top padding from header so it sits correctly at the top of SafeAreaView
  header: { padding: 20, paddingTop: 8, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' }, 
  logo: { fontSize: 22, fontWeight: '700', color: '#4A90E2' },
  welcome: { marginTop: 8, color: '#333', textAlign: 'center' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomNote: { padding: 12, alignItems: 'center' },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  label: { marginTop: 12, fontWeight: '600', color: '#444' },
  valueText: { marginTop: 6, fontSize: 16, color: '#222' },
  priceLarge: { marginTop: 6, fontSize: 26, fontWeight: '700', color: '#4A90E2' },

  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginTop: 6 },
  pickerWrapper: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 6, overflow: 'hidden' },

  button: { backgroundColor: '#4A90E2', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  card: { backgroundColor: '#fafafa', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  thumbnailPlaceholder: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee', marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  cardPrice: { marginTop: 8, fontWeight: '700', color: '#4A90E2' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 16, maxHeight: '80%' },
  optionRow: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },

  tabButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#e6f0ff' },
  tabText: { color: '#333' },
  tabActiveText: { color: '#2b6cb0', fontWeight: '700' },
});